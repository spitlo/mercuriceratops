import { yellow } from "https://deno.land/std/fmt/colors.ts";

export const helpText = `
${yellow("USAGE:")}
  mercuriceratops gemini://gemini.circumlunar.space/

  To go back, enter 'b' at the prompt. To quit, enter 'q'.
  To follow a link, enter the number and press enter.

${yellow("OPTIONS:")}
  -h, --help
      Prints help
  -d, --dump
      Prints document body and exits
  -w, --width <number>
      Wraps text at <number> columns
`;

export const startText = `
# Welcome to Mercuriceratops!

If you are new to the gemini project, here are some links to get you started:

=> gemini://gemini.circumlunar.space/ Project Gemini Website
=> gemini://mozz.us/ Personal website of Michael Lazar and the fifth gemini server in the world
`;
