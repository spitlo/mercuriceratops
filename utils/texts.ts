import { green, yellow } from "https://deno.land/std/fmt/colors.ts";

export const helpText = `
${yellow("USAGE:")}
  ./mercuriceratops [URL]

  To visit a Gemini page, enter the URL at the URL> prompt.
  To go back, enter 'b' at the prompt. To quit, enter 'q'.
  To search using gus.guru, enter 's' and then enter your query at the SEARCH> prompt.
  To follow a link, enter the number and press enter.

${yellow("OPTIONS:")}
  -h, --help
      Prints help
  -d, --dump
      Prints document body and exits
  -w, --width <number>
      Wraps text at <number> columns
`;

export const mercuriceratops = `                            _____  _____
                           /     \\\/     \\
                          /  __  !!  __  \\
                         <  ___  ||  ___  >
                   .______\\\  __  !!  __  /______.
                  /        \\\     ||     /        \\
                 /      (O)=            =(O)      \\
                |           \\\         /  .         |
                |   .        /{}\`  ´{}\\\            |
                |            \\\  o  o  /       .    |\\
                |        .    \\\  {}  /             | \\´
                |              \\\    /   .          |  \\´
                 \\\   .          \\\  /              /\\\   \\´
                  \\\       \\\      \\\/  .    /      /  \\\   \\´____,
                  /        V----_____----V        \\\  \\\______/´
                 |  ^ ^ ^ /               \\\ ^ ^ ^  |
                 o o o o |                 | o o o o`;

export const logo = `
 .  . ____ ____ ____ _  _ ____ _ ____ ____ ____ ____ ___ ____ ___  ______>
 |\\\/| |___ |__/ |    |  | |__/ | |    |___ |__/ |__|  |  |  | |__] [__
 L  L |___ L  \\\ |___ |__| L  \\\ | |___ |___ L  \\\ L  |  L  |__| L  _____]
- -- ----- ---- ---------------------------- ---- -------------- ---- --- -`;

export const startText = `
\`\`\`
${green(mercuriceratops)}
${yellow(logo)}
\`\`\`

# Welcome to Mercuriceratops!

 ╴ To visit a Gemini page, enter the URL at the URL> prompt.
 ╴ To go back, enter 'b' at the prompt. To quit, enter 'q'.
 ╴ To search, enter 's' and type a query at the SEARCH> prompt.
 ╴ To follow a link, enter the link number and press enter.

If you are new to the Gemini project, here are some links to get you started:

=> gemini://gemini.circumlunar.space/ Project Gemini Website
=> gemini://mozz.us/ Personal website of Michael Lazar and the fifth gemini server in the world
`;
