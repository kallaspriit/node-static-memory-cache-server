import chalk from "chalk";
import * as express from "express";
import * as basicAuth from "express-basic-auth";
import * as st from "st";
import * as path from "path";
import hostRedirectMiddleware from "./middlewares/hostRedirectMiddleware";
import httpsRedirectMiddleware from "./middlewares/httpsRedirectMiddleware";
import config from "./services/config";
import createServer from "./services/createServer";
import getPackageInfo from "./services/getPackageInfo";

console.log("config", config);

(async () => {
  // create express server application
  const app = express();

  // redirect to a single hostname
  app.use(hostRedirectMiddleware(config.hostname));

  // configure basic auth if enabled
  if (config.auth.enabled) {
    app.use(
      basicAuth({
        users: {
          [config.auth.username]: config.auth.password,
        },
        challenge: true,
      }),
    );
  }

  // public files path
  const publicPath = path.join(__dirname, "..", "public");

  // serve public static files
  app.use(
    st({
      path: publicPath,
      url: "/",
      index: "index.html",
      gzip: true,
      cors: false,
      cache: {
        fd: {
          max: 1000,
          maxAge: config.cacheDurationMs,
        },
        stat: {
          max: 1000,
          maxAge: config.cacheDurationMs,
        },
        content: {
          max: 4 * 1000 * 1000 * 1000, // 4GB
          maxAge: config.cacheDurationMs,
          cacheControl: `public, max-age=${config.cacheDurationMs / 1000}`,
        },
        index: {
          max: 10 * 1000 * 1000, // 10MB
          maxAge: config.cacheDurationMs,
        },
        readdir: {
          max: 1000,
          maxAge: config.cacheDurationMs,
        },
      },
    }),
  );

  // create web server (either http or https based on config)
  const server = createServer(app, config.ssl);
  const packageInfo = await getPackageInfo(path.join(__dirname, "..", "package.json"));
  const version = packageInfo.version;

  // start listening on requested port
  server.listen(config.port, () => {
    console.log(
      `started server ${chalk.reset(chalk.bold(`v${version}`))} on port ${chalk.bold(config.port.toString())}`,
    );

    if (config.auth.enabled) {
      console.log(
        `basic auth is enabled, use ${chalk.bold(config.auth.username)}:${chalk.bold(
          config.auth.password,
        )} to authenticate`,
      );
    }
  });

  // create a http server that redirects to https if https is enabled
  if (config.ssl.enabled) {
    const httpPort = 80;

    express()
      .use(httpsRedirectMiddleware(config.hostname))
      .listen(httpPort);
  }
})().catch(error => {
  console.log(`${chalk.bgRed(chalk.white(" ERROR "))} ${error.message}`);
});
