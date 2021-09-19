# Overlord
A runner for your scripts so you don't have to deploy them. 🚀

Overlord takes a root directory (or a root URL) containing a bunch of JS or TS scripts and serves them using a lightweight http server. Each time overlord receives a request, it spawns a Worker which imports the scripts and runs it in an isolated environment.

> Experimental. Use at your own risk. 💥

## Background
Deno is very suitable for running scripts. It's a single executable, you don't have to manage dependencies, it has top-level await, and runs Typescript by default. I wanted to add upon that by providing an easy and secure way to call these scripts remotely.

## Usage
### CLI
1. Install it: `deno --unstable install --allow-net --allow-read https://deno.land/x/overlord/cli.ts`
2. Use it: `overlord -r https://deno.land/x/overlord/examples`
3. Try it: `curl localhost:8080/hello_world.ts`

### Programatically
```ts
import { Overlord } from "https://deno.land/x/overlord/mod.ts"

const overlord = new Overlord({
    rootPath: "https://deno.land/x/overlord/examples",
    port: 5000,
});

overlord.start();
```

## Features
1. Zero dependancies (unless you count deno std).
2. Lightweight and fast; with an ~80mb executable and just using deno std http server.
3. Easy configuration.
4. Deploy anywhere; your local machine, a server, in docker or kubernetes, or even serverless (with some caching considerations).

## When Should I Use This?
1. You want to run scripts in an isolated environment.
2. You want a self-hostable alternative to deno deploy.
3. Lazy load and build your scripts.

## Roadmap
1. Remove `unstable` features once Deno 2.0 is released.
2. Support WebAssembly.
3. Resource limits for workers. [This is not planned to be supported by Deno at the moment](https://github.com/denoland/deno/issues/7419), so we will have to find a workaround.
