import {
  BufReader,
  Kia,
  TextProtoReader,
  TimeoutError,
  blue,
  log,
  magenta,
  parse,
  timeout,
  yellow,
} from "./deps.ts";
import type { Args } from "./deps.ts";
import { getHostname, spinners } from "./utils/misc.ts";
import { helpText, startText } from "./utils/texts.ts";
import { parser } from "./utils/gemini.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

// Use an arbitrary number for now, but perhaps check terminal height?
const DEFAULT_MAX_LINES = 50;
const DEFAULT_TIMEOUT = 5;
const defaults: {
  dump: boolean;
  paginate: boolean | number;
  verbose: boolean;
  width: number;
} = {
  dump: false,
  paginate: false,
  verbose: false,
  width: 0,
};

let firstRun = true;
let history: Array<string> = [];
let links: Array<string> = [];
let page = 1;
let spinner: Kia;
let url: string;
let search: string | null;

// Parse command line arguments
const parsedArgs: Args = parse(Deno.args.slice(0), {
  alias: {
    dump: "d",
    help: "h",
    paginate: "p",
    timeout: "t",
    verbose: "V",
    width: "w",
  },
  boolean: ["d", "dump", "h", "help"],
  default: defaults,
});

if (parsedArgs.help) {
  console.log(helpText);
  Deno.exit(1);
} else {
  url = (parsedArgs._[0] || "").toString();
}

const options = {
  dump: parsedArgs.dump,
  maxLines: DEFAULT_MAX_LINES,
  paginate: defaults.paginate,
  timeout: DEFAULT_TIMEOUT,
  verbose: parsedArgs.verbose,
  width: defaults.width,
};

if (parsedArgs.paginate) {
  options.paginate = true;
  if (
    Number.isInteger(Number(parsedArgs.paginate)) &&
    Number(parsedArgs.paginate) > 1
  ) {
    options.maxLines = Number(parsedArgs.paginate);
  }
}

if (parsedArgs.timeout && Number.isInteger(Number(parsedArgs.timeout))) {
  options.timeout = Number(parsedArgs.timeout);
}

if (parsedArgs.width && Number.isInteger(Number(parsedArgs.width))) {
  options.width = Number(parsedArgs.width);
}

const tpr = new TextProtoReader(new BufReader(Deno.stdin));
let line: string | null;

const interactiveMode = !url;

while (true) {
  if (interactiveMode) {
    // On first run in interactive mode, show a little welcome message
    if (firstRun && !options.dump) {
      console.log(parser(startText, "", options.width).formatted.join("\n"));
      links = parser(startText, "", options.width).bodyLinks;
      firstRun = false;
    }

    await Deno.stdout.write(encoder.encode("URL> "));
    line = await tpr.readLine();
    switch (line) {
      case "":
        continue;
      case "q":
        Deno.exit();
        break;
      case "h":
        console.log(parser(helpText, "", options.width).formatted.join("\n"));
        continue;
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
        search = await tpr.readLine();
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
    text: options.verbose
      ? `Connecting to ${hostname} with a timeout of ${options.timeout} seconds.`
      : `Connecting to <${hostname}>`,
  });
  spinner.start();

  let connection;
  try {
    connection = await timeout(
      Deno.connectTls(
        { hostname, port: 1965 },
      ),
      options.timeout * 1000,
    );
  } catch (error) {
    spinner.stop();
    log.warning(`Could not make connection to ${hostname}.`);
    if (error instanceof TimeoutError) {
      log.error(
        `Connection to ${hostname} timed out.`,
      );
    } else if (error && options.verbose) {
      log.error(error);
    }
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

  spinner.stop();

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
    // deno-lint-ignore no-case-declarations
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

      if (meta.startsWith("text/gemini")) {
        // This is a gemini document, parse it (get links, markdown)
        let { bodyLinks, formatted, plain } = parser(body, url, options.width);
        links = bodyLinks.slice(0);
        if (options.dump) {
          // For dumps, dont mind the page length
          console.log(plain.join("\n"));
        } else {
          if (!options.paginate) {
            console.log(formatted.join("\n"));
          } else {
            let pages = Math.floor(formatted.length / options.maxLines);
            if (formatted.length < options.maxLines) {
              // This page is shorter than max, just print it.
              console.log(formatted.join("\n"));
            } else {
              // This is a long page and needs pagination.
              while (formatted.length > 0) {
                for (
                  let xx = 0;
                  xx <= options.maxLines;
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

      // If dump is requested, we’re done. Exit successfully
      if (options.dump) {
        Deno.exit();
      }

      // Save url in history and clear it for the next iteration
      history.push(url);
      url = "";
  }
}
