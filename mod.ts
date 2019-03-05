import {
  App,
  Request,
  Response,
  Params,
  PathMatcher,
  Method,
  Next,
  Handler,
  EndHandler,
  Middleware,
  Query,
  KoboldController
} from './core/mod/index.ts';
export {
  App,
  Request,
  Response,
  Params,
  PathMatcher,
  Method,
  Next,
  Handler,
  EndHandler,
  Middleware,
  Query,
  KoboldController
};

export function Main(executor: Function) {
  executor();
}