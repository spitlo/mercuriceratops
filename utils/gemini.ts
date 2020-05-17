import {
  bold,
  inverse,
  italic,
  underline,
} from "../deps.ts";
import { getHostname, wordWrap } from "./misc.ts";

interface Result {
  bodyLinks: string[];
  formatted: string[];
  plain: string[];
}

export function parser(
  body: string,
  currentUrl: string,
  width: number,
): Result {
  const result: Result = {
    bodyLinks: [],
    formatted: [],
    plain: [],
  };

  let pre = false;
  for (let line of body.split("\n")) {
    if (line.startsWith("```")) {
      pre = !pre;
    } else if (pre) {
      result.formatted.push(line);
      result.plain.push(line);
    } else if (line.startsWith("# ")) {
      // Make H1 bold and underlined in interactive mode
      result.formatted.push(italic(underline(line.substring(2).trim())));
      result.plain.push(line);
    } else if (line.startsWith("## ")) {
      // Make H2 bold in interactive mode
      result.formatted.push("| " + bold(line.substring(3).trim()));
      result.plain.push(line);
    } else if (line.startsWith("### ")) {
      // Make H3 italic in interactive mode
      result.formatted.push(":: " + bold(line.substring(4).trim()));
      result.plain.push(line);
    } else if (line.startsWith("=>")) {
      line = line.substring(2).trim();
      const lineParts = line.split(/\s/);
      // Assume the best
      let link = lineParts[0];
      // If no protocol, assume relative link and add current hostname
      // TODO: This is a pretty naive implementation, fix it
      if (!link.includes("://")) {
        if (link.substring(0, 1) === "/") {
          link = `gemini://${getHostname(currentUrl)}${link}`;
        } else if (link.substring(0, 1) == ".") {
          link = `gemini://${getHostname(currentUrl)}/${link}`;
        } else {
          link = `${currentUrl}${link}`;
        }
        // Remove any double slashes except for ://
        link = link.replace(/(?<!:)\/\//g, "/");
      }
      result.bodyLinks.push(link);
      const linkLabel = lineParts.length === 1
        ? link
        : lineParts.slice(1).join(" ");

      result.formatted.push(
        `${
          underline(inverse(` ${result.bodyLinks.length.toString()} `))
        } ${linkLabel}${linkLabel === link ? "" : ` (${link})`}\n`,
      );

      if (linkLabel === link) {
        // No link label, output as plain link
        result.plain.push(`<${link}>`);
      } else {
        // Link label
        result.plain.push(`[${linkLabel}](${link})`);
      }
    } else {
      // This is ordinary text. If user has set a width, apply it
      let output;
      if (width) {
        output = wordWrap(line, width);
      } else {
        output = line;
      }
      result.formatted.push(output);
      result.plain.push(output);
    }
  }

  return result;
}
