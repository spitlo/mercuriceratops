import {
  BufReader,
  Kia,
  TextProtoReader,
  log,
  parse,
} from "./deps.ts";
import { getHostname, spinners } from "./utils/misc.ts";
import { helpText, startText } from "./utils/texts.ts";
import { parser } from "./utils/gemini.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

// Use an arbitrary number for now, but perhaps check terminal height?
const MAX_LINES = 50;

let dump = false;
let firstRun = true;
let history: Array<string> = [];
let links: Array<string> = [];
let page = 0;
let spinner: any;
let url: string;
let width: number = 0;

// Parse command line arguments
const parsedArgs = parse(Deno.args.slice(0));
if (parsedArgs.h || parsedArgs.help) {
  console.log(helpText);
  Deno.exit(1);
} else {
  url = (parsedArgs._[0] || "").toString();
}

if (parsedArgs.d || parsedArgs.dump) {
  dump = true;
}

if (parsedArgs.w || parsedArgs.width) {
  // Ok, time to use a helper for this stuff?
  if (Number.isInteger(Number(parsedArgs.w))) {
    width = Number(parsedArgs.w);
  } else if (
    Number.isInteger(Number(parsedArgs.width))
  ) {
    width = Number(parsedArgs.width);
  }
}

const tpr = new TextProtoReader(new BufReader(Deno.stdin));
let line: string | null;

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

  const connection = await Deno.connectTls(
    { hostname, port: 1965 },
  );

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
          console.log(plain.join("\n"));
        } else {
          if (formatted.length > MAX_LINES) {
            while (page * MAX_LINES < formatted.length) {
              for (let xx = page * MAX_LINES; xx <= MAX_LINES; xx++) {
                console.log(formatted[xx]);
              }
              console.log("Page + 1", page + 1); /* eslint-disable-line */
              console.log(
                "Page + 1 * MAX_LINES",
                (page + 1) * MAX_LINES,
              ); /* eslint-disable-line */
              console.log(
                "formatted.length",
                formatted.length,
              ); /* eslint-disable-line */
              if ((page + 1) * MAX_LINES < formatted.length) {
                console.log(
                  `---=== Page ${page}/${
                    Math.floor(formatted.length / MAX_LINES)
                  }. Press enter to continue ===---`,
                );
                await tpr.readLine();
                page++;
              }
            }
            page = 0;
          } else {
            console.log(formatted.join("\n"));
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
