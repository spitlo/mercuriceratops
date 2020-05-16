import {
  BufReader,
  Kia,
  TextProtoReader,
  inverse,
  log,
  parse,
  underline,
} from "./deps.ts";
import wordWrap from "./utils/wordWrap.ts";

const parsedArgs = parse(Deno.args.slice(0));
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const spinners = {
  bounce: {
    // TODO: Make this bounce a bit more
    frames: [
      "[╴  ]",
      "[╼  ]",
      "[ ╸ ]",
      "[  ╺]",
      "[  ╾]",
      "[ ╺ ]",
      "[╺  ]",
    ],
    interval: 120,
  },
  blink: {
    frames: ["╌", "╍"],
    interval: 400,
  },
};
const spinner = new Kia({
  color: "yellow",
  spinner: spinners.bounce,
});

let links: Array<string> = [];
let history: Array<string> = [];

let url: string;
let dump = false;
let width: number | boolean = false;

const helpText = `
USAGE:
  mercuriceratops gemini://gemini.circumlunar.space/

  To go back, enter 'b' at the prompt. To quit, enter 'q'.
  To follow a link, enter the number and press enter.

OPTIONS:
  -h, --help
      Prints help
  -d, --dump
      Prints document body and exits
  -w, --width <number>
      Wraps text at <number> columns
`;

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

while (true) {
  if (!url) {
    const tpr = new TextProtoReader(new BufReader(Deno.stdin));
    await Deno.stdout.write(encoder.encode("URL> "));
    const line = await tpr.readLine();
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
        history = history.slice(1);
        links = [];
        break;
      case "f":
        log.info("Moving forward is not yet implemented, sorry :(");
        continue;
      default:
        if (Number.isInteger(Number(line))) {
          // This is a link
          let linkNumber = Number(line);
          if (linkNumber > 0) {
            linkNumber -= 1;
          }
          url = links[linkNumber];
          links = [];
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

  // Check url
  if (!url.includes("://")) {
    url = `gemini://${url}`;
  }
  if (url.substr(0, 7) !== "gemini:") {
    log.warning("Only Gemini links, sorry");
    url = "";
    continue;
  }
  // Parse url the awkward way
  const parsedUrl = new URL(url.replace("gemini://", "https://"));

  await spinner.set({ text: `Connecting to <${parsedUrl.hostname}>` });
  await spinner.start();

  const connection = await Deno.connectTls(
    { hostname: parsedUrl.hostname, port: 1965 },
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
      break;
    case 3:
      log.info(`Following redirect to: ${meta}`);
      url = meta;
      break;
    case 4:
      log.error("Error, sorry. Try again.");
      break;
    case 2:
      if (!meta.startsWith("text/")) {
        log.warning(
          "Sorry, I can only handle text responses. Try a different url.",
        );
        break;
      }
      const bodyBytes = await Deno.readAll(reader);
      const body = decoder.decode(bodyBytes);

      if (meta === "text/gemini") {
        // This is a gemini document
        let pre = false;
        for (let line of body.split("\n")) {
          if (line.startsWith("```")) {
            pre = !pre;
          } else if (pre) {
            console.log(line);
          } else if (line.startsWith("=>")) {
            line = line.substring(2).trim();
            const lineParts = line.split(/\s/);
            // Assume the best
            let link = lineParts[0];
            // If no protocol, assume relative link and add current hostname
            // TODO: This is a very naive implementation, fix it
            if (!link.includes("://")) {
              link = `${url}${link}`;
            }
            links.push(link);
            const linkLabel = lineParts.length === 1
              ? link
              : lineParts.slice(1).join(" ");
            if (dump) {
              // This is a dump, output as markdown
              if (linkLabel === link) {
                // No link label, output as plain link
                console.log(`<${link}>`);
              } else {
                // Link label
                console.log(`[${linkLabel}](${link})`);
              }
            } else {
              console.log(
                `${
                  underline(inverse(` ${links.length.toString()} `))
                } ${linkLabel} (${link})\n`,
              );
            }
          } else {
            // This is ordinary text. If user has set a width, apply it
            if (width) {
              console.log(wordWrap(line, width));
            } else {
              console.log(line);
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
