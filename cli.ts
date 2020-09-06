import {
  Args,
  BufReader,
  Kia,
  TextProtoReader,
  blue,
  magenta,
  log,
  parse,
  yellow,
} from "./deps.ts";
import { getHostname, spinners } from "./utils/misc.ts";
import { helpText, startText } from "./utils/texts.ts";
import { parser } from "./utils/gemini.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

// Use an arbitrary number for now, but perhaps check terminal height?
const DEFAULT_MAX_LINES = 50;
const defaults: {
  dump: boolean;
  paginate: boolean | number;
  width: number;
} = {
  dump: false,
  paginate: false,
  width: 0,
};

let { dump, paginate, width } = defaults;

let firstRun = true;
let history: Array<string> = [];
let links: Array<string> = [];
let maxLines = DEFAULT_MAX_LINES;
let page = 1;
let spinner: any;
let url: string;

// Parse command line arguments
const parsedArgs: Args = parse(Deno.args.slice(0), {
  alias: {
    dump: "d",
    paginate: "p",
    width: "w",
  },
  default: defaults,
});

if (parsedArgs.help) {
  console.log(helpText);
  Deno.exit(1);
} else {
  url = (parsedArgs._[0] || "").toString();
}

if (parsedArgs.dump) {
  dump = true;
}

if (parsedArgs.width) {
  if (
    Number.isInteger(Number(parsedArgs.width))
  ) {
    width = Number(parsedArgs.width);
  }
}

if (parsedArgs.paginate) {
  paginate = true;
  if (
    Number.isInteger(Number(parsedArgs.paginate)) &&
    Number(parsedArgs.paginate) > 1
  ) {
    maxLines = Number(parsedArgs.paginate);
  }
}

const tpr = new TextProtoReader(new BufReader(Deno.stdin));
let line: string | null;

const interactiveMode = !url;

while (true) {
  if (!url) {
    // On first run in interactive mode, show a little welcome message
    if (firstRun && !dump) {
      console.log(parser(startText, "", width).formatted.join("\n"));
      links = parser(startText, "", width).bodyLinks;
      firstRun = false;
    }

    await Deno.stdout.write(encoder.encode("URL> "));
    line = await tpr.readLine();
    switch (line) {
      case "":
        continue;
      case "q":
        Deno.exit();
      case "b":
        if (history.length < 2) {
          log.info("No history yet");
          continue;
        }
        url = history[history.length - 2];
        history = history.slice(0, -1);
        break;
      case "f":
        log.info("Moving forward is not yet implemented, sorry :(");
        continue;
      case "s":
        await Deno.stdout.write(encoder.encode("SEARCH> "));
        const search = await tpr.readLine();
        if (search) {
          url = `gemini://gus.guru/search?${encodeURIComponent(search)}`;
        }
        continue;
      default:
        if (Number.isInteger(Number(line))) {
          // This is a link
          let linkNumber = Number(line);
          if (linkNumber > 0) {
            linkNumber -= 1;
          }
          url = links[linkNumber];
        } else {
          // line is a url. TODO! Check if it’s valid
          if (!line) {
            log.error("Invalid url");
            break;
          }
          url = line;
        }
        break;
    }
  }

  firstRun = false;

  // Check url
  if (!url) {
    log.warning("Couldn’t find that link, try again");
    continue;
  }
  if (!url.includes("://")) {
    url = `gemini://${url}`;
  }
  if (url.substr(0, 7) !== "gemini:") {
    log.warning("Only Gemini links, sorry");
    url = "";
    continue;
  }

  const hostname = getHostname(url);

  spinner = new Kia({
    color: "yellow",
    spinner: spinners.bounce,
    text: `Connecting to <${hostname}>`,
  });
  await spinner.start();

  let connection;
  try {
    connection = await Deno.connectTls(
      { hostname, port: 1965 },
    );
  } catch (error) {
    log.warning(`Could not make connection to ${hostname}.`);
    log.error(error);
    await spinner.stop();
    if (interactiveMode) {
      url = "";
      continue;
    } else {
      break;
    }
  }

  await connection.write(encoder.encode(`${url}\r\n`));

  const reader = new BufReader(connection);
  const responseHeader = await reader.readString("\n");
  const [status, meta] = (responseHeader || "4 ").split(/\s/);
  const statusCode = Number(status.substr(0, 1));

  await spinner.stop();

  switch (statusCode) {
    case 1:
    case 6:
      log.error("Sorry, the server requsted an unsupported feature.");
      url = "";
      continue;
    case 3:
      log.info(`Following redirect to: ${meta}`);
      url = meta;
      continue;
    case 4:
      log.error("Error, sorry. Try again.");
      url = "";
      continue;
    case 2:
      if (!meta.startsWith("text/")) {
        log.warning(
          "Sorry, I can only handle text responses. Try a different url.",
        );
        continue;
      }
      const bodyBytes = await Deno.readAll(reader);
      const body = decoder.decode(bodyBytes);

      console.log("\n");

      if (meta === "text/gemini") {
        // This is a gemini document, parse it (get links, markdown)
        let { bodyLinks, formatted, plain } = parser(body, url, width);
        links = bodyLinks.slice(0);
        if (dump) {
          // For dumps, dont mind the page length
          console.log(plain.join("\n"));
        } else {
          if (!paginate) {
            console.log(formatted.join("\n"));
          } else {
            let pages = Math.floor(formatted.length / maxLines);
            if (formatted.length < maxLines) {
              // This page is shorter than max, just print it.
              console.log(formatted.join("\n"));
            } else {
              // This is a long page and needs pagination.
              while (formatted.length > 0) {
                for (
                  let xx = 0;
                  xx <= maxLines;
                  xx++
                ) {
                  if (formatted.length > 0) {
                    console.log(formatted.shift());
                  }
                }
                if (formatted.length > 0) {
                  console.log(
                    blue(
                      `---=== Page ${yellow(page.toString())}/${
                        magenta(pages.toString())
                      }. Press enter to continue ===---`,
                    ),
                  );
                  await tpr.readLine();
                  page++;
                }
              }
              page = 1;
            }
          }
        }
      } else {
        // Something else, just print it
        console.log(body);
      }

      // If dump is reuested, we’re done. Exit successfully
      if (dump) {
        Deno.exit();
      }

      // Save url in history and clear it for the next iteration
      history.push(url);
      url = "";
  }
}
