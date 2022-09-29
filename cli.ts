import { parse } from "flags/mod.ts";
import { Overlord, OverlordOptions } from "./mod.ts";

const args = parse(Deno.args, {
  alias: {
    help: "h",
    port: "p",
    timeout: "t",
    logLevel: "l",
    minionPoolSize: "s",
    rootPath: "r",
    appendFileExtension: "a",
  },
});

if (args.help) {
  console.log("A runner for your scripts so you don't have to deploy them. 🚀");
  console.log();
  console.log("Options:");
  console.log(
    " -h, --help                  Prints help information",
  );
  console.log(
    " -p, --port                  The port to run the server on",
  );
  console.log(
    " -t, --timeout               Maximum time allowed for a single minion to handle a request. In milliseconds",
  );
  console.log(
    " -l, --logLevel              Sets the minimum log level for the overlord logger",
  );
  console.log(
    " -s, --minionPoolSize        The maximum number of minions to be spawned in parallel",
  );
  console.log(
    " -r, --rootPath              The path of the root directory in which overlord can find the runnable scripts",
  );
  console.log(
    " -a, --appendFileExtension   A file extension to append to request URLS",
  );
  console.log();
  console.log("For more info, visit: https://doc.deno.land/https/deno.land/x/overlord/mod.ts#BaseOverlordOptions");
} else {
  if (!args.rootPath) {
    console.error("A rootPath has to be specified.");
    Deno.exit(1);
  }

  const overlord = new Overlord(args as unknown as OverlordOptions);

  await overlord.start();
}
