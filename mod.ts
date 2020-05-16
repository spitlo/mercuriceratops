import { BufReader, Kia, TextProtoReader, log, parse } from "./deps.ts";

const parsedArgs = parse(Deno.args.slice(0));
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const spinner = new Kia({
  color: 'cyan',
  spinner: {
    frames: [
      '[╴  ]',
      '[╼  ]',
      '[ ╸ ]',
      '[  ╺]',
      // '[   ]', TODO
      '[  ╾]',
      '[ ╺ ]',
      '[╺  ]',
      // '[   ]', TODO
    ],
    interval: 120,
  },
})
// ╴	╵	╶	╷	╸	╹	╺	╻	╼	╽	╾

let links: Array<string> = [];
let history: Array<string> = [];

let url: string;

const helpText = `
Usage:
mercuriceratops gemini://gemini.circumlunar.space/
To go back, enter 'b' at the prompt. To quit, enter 'q'.
To follow a link, enter the number and press enter.
`;

if (parsedArgs.h || parsedArgs.help) {
  console.log(helpText);
  Deno.exit(1);
} else {
  url = (parsedArgs._[0] || "").toString();
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
        break;
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
        break;
      default:
        if (Number.isInteger(Number(line))) {
          // This is a link
          let linkNumber = Number(line);
          if (linkNumber > 0) {
            linkNumber -= 1;
          }
          url = links[linkNumber];
          // If no protocol, assume relative link and add current hostname
          // This is a very naive implementation
          if (!url.includes("://") && history.length > 0) {
            let currentHost = history[history.length - 1];
            const parsedCurrentHost = new URL(
              currentHost.replace("gemini://", "https://"),
            );
            url = `gemini://${parsedCurrentHost.hostname}/${url}`;
          }
          links = [];
        } else {
          // line is a url. TODO! Check if it’s valid
          if (!line) {
            log.error("Invalid url");
            continue;
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

  await spinner.set({ text: `Connecting to <${parsedUrl.hostname}>` })
  await spinner.start()

  const connection = await Deno.connectTls(
    { hostname: parsedUrl.hostname, port: 1965 },
  );

  await connection.write(encoder.encode(`${url}\r\n`));

  const reader = new BufReader(connection);
  const responseHeader = await reader.readString("\n");
  const [status, meta] = (responseHeader || "4 ").split(/\s/);
  const statusCode = Number(status.substr(0, 1));

  await spinner.stop()

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
        continue;
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
            links.push(lineParts[0]);
            const linkLabel = lineParts.length === 1
              ? lineParts[0]
              : lineParts.slice(1).join(" ");
            console.log(`[${links.length}] ${linkLabel}\n`);
          } else {
            console.log(line);
          }
        }
      } else {
        // Something else, just print it
        console.log(body);
      }
      history.push(url);
      url = "";
  }
}
