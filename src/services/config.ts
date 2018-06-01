import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({
  path: path.join(__dirname, "..", "..", "..", ".env"),
});

interface IConfig {
  hostname: string;
  port: number;
  ssl: {
    enabled: boolean;
    cert: string;
    key: string;
  };
  auth: {
    enabled: boolean;
    username: string;
    password: string;
  };
  cacheDurationMs: number;
}

const defaultHttpPort = 80;
const defaultCacheDurationMs = 60 * 60 * 1000;
const radix = 10;

const config: IConfig = {
  hostname: process.env.SERVER_HOSTNAME !== undefined ? process.env.SERVER_HOSTNAME : "localhost",
  port: process.env.SERVER_PORT !== undefined ? parseInt(process.env.SERVER_PORT, radix) : defaultHttpPort,
  ssl: {
    enabled: process.env.SERVER_SSL_ENABLED !== undefined ? process.env.SERVER_SSL_ENABLED === "true" : false,
    cert: process.env.SERVER_SSL_CERT !== undefined ? process.env.SERVER_SSL_CERT : "cert.pem",
    key: process.env.SERVER_SSL_KEY !== undefined ? process.env.SERVER_SSL_KEY : "key.pem",
  },
  auth: {
    enabled:
      process.env.SERVER_BASIC_AUTH_ENABLED !== undefined ? process.env.SERVER_BASIC_AUTH_ENABLED === "true" : false,
    username: process.env.SERVER_BASIC_AUTH_USERNAME !== undefined ? process.env.SERVER_BASIC_AUTH_USERNAME : "admin",
    password: process.env.SERVER_BASIC_AUTH_PASSWORD !== undefined ? process.env.SERVER_BASIC_AUTH_PASSWORD : "",
  },
  cacheDurationMs:
    process.env.SERVER_CACHE_DURATION_MS !== undefined
      ? parseInt(process.env.SERVER_CACHE_DURATION_MS, radix)
      : defaultCacheDurationMs,
};

export default config;
