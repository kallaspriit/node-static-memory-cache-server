declare module "st" {
  import { Request, RequestHandler, Response } from "express";

  function st(options?: st.Options): RequestHandler;

  namespace st {
    interface Options {
      path: string;
      url?: string;
      passthrough?: boolean;
      cors?: boolean;
      gzip?: boolean;
      index?: boolean | string;
      cache?: any; // TODO: types..
    }
  }

  export = st;
}
