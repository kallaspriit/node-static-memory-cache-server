import { NextFunction, Request, RequestHandler, Response } from 'express';

export default function hostRedirectMiddleware(hostname: string): RequestHandler {
	return async (request: Request, response: Response, next: NextFunction) => {
		if (request.hostname !== hostname) {
			response.redirect(`${request.protocol}://${hostname}${request.originalUrl}`);
		} else {
			next();
		}
	};
}
