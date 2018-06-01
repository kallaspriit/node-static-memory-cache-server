import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";

export interface ISslConfig {
  enabled: boolean;
  cert: string;
  key: string;
}

export default function createServer(app: express.Express, sslConfig: ISslConfig): http.Server | https.Server {
  if (sslConfig.enabled) {
    return https.createServer(
      {
        cert: fs.readFileSync(sslConfig.cert),
        key: fs.readFileSync(sslConfig.key),
      },
      app,
    );
  }

  return http.createServer(app);
}
