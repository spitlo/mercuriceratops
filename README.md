# Mercuriceratops

```text
                              _---_  _---_
                             /     \/     \
                            /  __  !!  __  \                               x
                           (  ___  ||  ___  )                             .
                      .__---\  __  !!  __  /---__.                 .   .
                    /        \   _ || _   /        \           .
                   /      (O)=     ..     =(O)      \        .
                  |-          \         /  .         |         .
  (*)             |   .        /{}`  ´{}\            |       .
    \  (-)        |            \ c    c /       .    |\   .
     \V/          |        .    \  {}  /             |-\´
     ´\           |_             \    /   .          |--\´
      V            \   .   V      \/\7       7      /\---\´     ,
  (+) |             \       \      \/  .    /      /  \---\´___/\,
    \  (x)          /__      V=---_____---=V    .  _\  \________/´
    ´\v/            |        /--¨       ¨--\        |
   .. V .  ...    _/o^o^o^o^`\_           _/´^o^o^o^o\_   .  ..spitlo 2020
 __ .  . ____ ____ ____ _  _ ____ _ ____ ____ ____ ____ ___ ____ ___  ______>
    |\/| |___ |__/ |    |  | |__/ | |    |___ |__/ |__|  |  |  | |__] [__
    L  L |___ L  \ |___ |__| L  \ | |___ |___ L  \ L  |  L  |__| L  _____]
 - -- ----- ---- ---------------------------- ---- -------------- -/-- --- - +
```

## A Gemini client written for Deno

This is a very basic client for Gemini, inspired by the [100 LOC demos](https://tildegit.org/solderpunk) by solderpunk. Mainly to try Deno, but also to test the Gemini protocol.

## Install

Assuming Deno is installed and Deno bin is added to path:

```bash
$ deno install --allow-net -n merc https://denopkg.com/spitlo/mercuriceratops@v1.2.1/cli.ts
```

## Run from source

Assuming Deno is installed:

```bash
$ cd mercuriceratops
$ ./merc
URL>
```

You can also supply a URL directly:

```bash
$ ./merc gemini.circumlunar.space
Connecting to <gemini.circumlunar.space>
Following redirect to: gemini://gemini.circumlunar.space/
Connecting to <gemini.circumlunar.space>
```

To visit a Gemini page, enter the URL at the `URL>` prompt.
To go back, enter 'b' at the prompt. To quit, enter 'q'.
To search using gus.guru, enter 's' and then enter your query at the `SEARCH>` prompt.
To follow a link, enter the link number and press enter.

### Options

```text
  -h, --help
          Prints help end exits
  -d, --dump
          Prints document body and exits
  -w, --width <number>
          Wraps text at <number> columns
  -p, --paginate <number>
          Show <number> of rows at a time.
          Defaults to 50 if no <number> is supplied
```

## Todo

- [x] Pagination
- [x] More/better styling in interactive mode
- [x] Fix "up" (../) links
- [x] Break out Gemini parser
- [x] Add start page
- [x] Fix links on start page
- [x] Add more todos
- [x] Add search (gemini://gus.guru/)
- [x] Fix 'b', back works more like `cd -` now
- [x] Clean up argument parsing
- [x] Deno install (`merc`?)
- [x] Lock dependency versions
- [ ] Word wrap for headers when width is set
- [ ] Word wrap for link labels when width is set
- [ ] Implement 'f', forward
- [ ] Bookmarks?
- [ ] Handle gopher?
- [ ] Handle downloads?
- [ ] Handle http(s)?

---

### Reference

[Gemini specs](https://gemini.circumlunar.space/docs/spec-spec.txt)
