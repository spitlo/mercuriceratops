import { cyan, green, magenta, red, white, yellow } from "../deps.ts";

export const helpText = `
${yellow("USAGE:")}
  merc [URL]

  To visit a Gemini page, enter the URL at the URL> prompt.
  To go back, enter 'b' at the prompt. To quit, enter 'q'.
  To search using gus.guru, enter 's' and then enter your query at the SEARCH> prompt.
  To follow a link, enter the link number and press enter.

${yellow("OPTIONS:")}
  -d, --dump
      Prints document body and exits
  -h, --help
      Prints help
  -p, --paginate <number>
      Show <number> of rows at a time.
      Defaults to 50 if no <number> is supplied.
  -t, --timeout <number>
      Seconds to try connecting before timeouting.
      Defaults to 5.
  -w, --width <number>
      Wraps text at <number> columns
`;

export const mascot = `                               _---_  _---_
                              /     \\\/     \\
                             /  __  !!  __  \\
                            (  ___  ||  ___  )
                       .__---\\\  __  !!  __  /---__.
                     /        \\\   _ || _   /        \\
                    /      (O)=     ..     =(O)      \\
                   |-          \\\         /  .         |
                   |   .        /{}\`  ´{}\\\            |
                   |            \\\ c    c /       .    |\\
                   |        .    \\\  {}  /             |-\\\´
                   |_             \\\    /   .          |--\\\´
                    \\\   .   V      \\\/\\7       7      /\\\---\\\´     ,
                     \\\       \\\      \\\/  .    /      /  \\\---\\\´___/\\\,
                     /__      V=---_____---=V    .  _\\\  \\\________/´
                    |        /--¨         ¨--\\\        |
    ..   .  ...   _/o^o^o^o^\`\\\_             _/´^o^o^o^o\\\_  .  ..${
  cyan("spitlo 2020")
}`;

const logoLines = [
  `__ .  . ____ ____ ____ _  _ ____ _ ____ ____ ____ ____ ___ ____ ___  ______>`,
  `   |\\\/| |___ |__/ |    |  | |__/ | |    |___ |__/ |__|  |  |  | |__] [__`,
  `   L  L |___ L  \\\ |___ |__| L  \\\ | |___ |___ L  \\\ L  |  L  |__| L  _____]`,
  `- -- ----- ---- ---------------------------- ---- -------------- -${
    yellow("/")
  }-- --- - +`,
];

const logoColors = [
  red,
  magenta,
  yellow,
  white,
];

export const logo = logoLines.map((line, i) => {
  return ` ${logoColors[i](line)}`;
}).join("\n");

export const startText = `
\`\`\`
${green(mascot)}
${logo}
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
