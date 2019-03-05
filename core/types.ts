export type Params = { [key: string]: string };
export type PathMatcher = (pattern: string) => (path: string) => Params;
export type Method = "HEAD" | "OPTIONS" | "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type Next = () => Promise<void>;
export type Handler = (req: Request, res: Response, next: Next) => Promise<any>;
export type EndHandler = (req: Request, res: Response) => Promise<any>;

export interface PathHandler {
  method: Method;
  pattern: string;
  match: (path: string) => any;
  handle: EndHandler;
}
export type Middleware = Handler | PathHandler;
export type Query = { [key: string]: string | string[] };