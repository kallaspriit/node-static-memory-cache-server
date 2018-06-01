import * as express from 'express';

export default function httpsRedirectMiddleware(hostname: string): express.RequestHandler {
	return (request, response, _next) => {
		response.redirect(`https://${hostname}${request.originalUrl}`);
	};
}
