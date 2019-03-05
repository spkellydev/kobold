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
  KoboldController,
  use_static
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
  KoboldController,
  use_static
};

export function Main(executor: Function) {
  executor();
}