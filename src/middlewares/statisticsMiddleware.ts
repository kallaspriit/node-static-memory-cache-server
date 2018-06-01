import { NextFunction, Request, RequestHandler, Response } from "express";

interface RequestLogItem {
  ip: string;
  requestCount: number;
}

interface UrlLogItem {
  url: string;
  requestCount: number;
}

let requestCount = 0;
let startTime = Date.now();
let requests: RequestLogItem[] = [];
let urls: UrlLogItem[] = [];

export default function statisticsMiddleware(): RequestHandler {
  return async (request: Request, response: Response, next: NextFunction) => {
    const showDetails = request.query.details !== undefined;
    const performReset = request.query.reset !== undefined;
    const elapsedTime = Math.ceil((Date.now() - startTime) / 1000);
    const requestsPerSecond = Math.round(requestCount / elapsedTime);
    const ip = request.ip;

    // reset if requested
    if (showDetails && performReset) {
      requestCount = 0;
      startTime = Date.now();
      requests = [];
      urls = [];

      response.redirect("/?details");

      return;
    }

    requestCount++;

    // log ips
    if (ip) {
      let requestIndex = requests.findIndex(item => item.ip === ip);

      if (requestIndex === -1) {
        requestIndex =
          requests.push({
            ip: ip,
            requestCount: 0,
          }) - 1;
      }

      requests[requestIndex].requestCount++;
    }

    // log urls
    let urlIndex = urls.findIndex(item => item.url === request.url);

    if (urlIndex === -1) {
      urlIndex =
        urls.push({
          url: request.url,
          requestCount: 0,
        }) - 1;
    }

    urls[urlIndex].requestCount++;

    if (!showDetails) {
      next();

      return;
    }

    requests.sort((a, b) => (a.requestCount > b.requestCount ? -1 : 1));
    urls.sort((a, b) => (a.requestCount > b.requestCount ? -1 : 1));

    response.status(200).send(`
      <h1>Server statistics</h1>
      <p>Your ip: ${request.ip}</p>
      <p>Handled ${requestCount} requests in ${elapsedTime}s (${requestsPerSecond} requests per second)</p>
      <p>Click <a href="/?details&reset">here</a> to reset counters.</p>

      <h2>High Scores</h2>
      <ol>
        ${requests
          .map(
            item =>
              `<li><strong>${item.ip.substring(7)}:</strong> ${item.requestCount} requests (${Math.round(
                item.requestCount / elapsedTime,
              )} rps)</li>`,
          )
          .join("\n")}
      </ol>

      <h2>URLs</h2>
      <ol>
        ${urls
          .map(
            item =>
              `<li><strong>${item.url}:</strong> ${item.requestCount} requests (${Math.round(
                item.requestCount / elapsedTime,
              )} rps)</li>`,
          )
          .join("\n")}
      </ol>
    `);
  };
}
