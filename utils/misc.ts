/*!
 * Adapted from word-wrap <https://github.com/jonschlinkert/word-wrap>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
*/
export function wordWrap(text: string, width: number): string[] {
  // Only split text if it’s longer than requested width
  if (!width || text.length < width) {
    return [text];
  }

  // Perhaps this is a better regex? https://stackoverflow.com/a/51506718
  const zwsp = "\\s\u200B";
  const regexString = `.{1,${width}}([${zwsp}]+|$)|[^${zwsp}]+?([${zwsp}]+|$)`;
  const re = new RegExp(regexString, "g");

  const lines = text.match(re) || [];
  const result = lines.map((line) => {
    if (line.slice(-1) === "\n") {
      line = line.slice(0, line.length - 1);
    }
    return line;
  });

  return result;
}

export function getHostname(url = ""): string {
  const parsedUrl = new URL(url.replace("gemini://", "https://"));
  return parsedUrl.hostname;
}

export const spinners = {
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
