# Mercuriceratops

## A Gemini client written for Deno

This is a very basic client for Gemini, inspired by the [100 LOC demos](https://tildegit.org/solderpunk) by solderpunk. Mainly to try Deno, but also to test the Gemini protocol.

To start client (assuming Deno is installed):

```bash
$ cd mercuriceratops
$ deno run --allow-net --quiet mod.ts
URL>
```

You can also supply a URL directly:

```bash
$ deno run --allow-net --quiet mod.ts gemini.circumlunar.space
Connecting to <gemini.circumlunar.space>
Following redirect to: gemini://gemini.circumlunar.space/
Connecting to <gemini.circumlunar.space>
```

To go back, enter `b` at the `URL>` prompt. To quit, enter `q`.
To follow a link, enter the number and press enter.

### Options

```
  -h, --help
          Prints help
  -d, --dump
          Prints document body and exits
```
