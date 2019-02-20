import {
  stat,
  open,
  resources,
  DenoError,
  ErrorKind,
  readFile,
  Reader,
  Closer
} from "deno";
import { lookup } from "https://raw.githubusercontent.com/denoland/deno_std/v0.2.6/media_types/mod.ts";
import { path, http, color } from "deps.ts";

type Method = "HEAD" | "OPTIONS" | "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type Next = () => Promise<void>;
type Handler = (req: Request, res: Response, next: Next) => Promise<any>;
type EndHandler = (req: Request, res: Response) => Promise<any>;

export interface PathHandler {
  method: Method;
  pattern: string;
  match: (path: string) => any;
  handle: EndHandler;
}
type Middleware = Handler | PathHandler;
type Query = { [key: string]: string | string[] };
type Params = { [key: string]: string };
type PathMatcher = (pattern: string) => (path: string) => Params;

export async function main() {
  let app = new App();
  app.get("/", async (req: Request, res: Response) => {
    await res.json({ hello: "world" });
  });
  app.listen(8000, "0.0.0.0");
}

export const simplePathMatcher: PathMatcher = _pattern => {
  const pattern = _pattern.split("/");
  const names = new Set();
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p[0] === "{" && p[p.length - 1] === "}") {
      const name = p.slice(1, -1).trim();
      if (!name) {
        throw new Error("invalid param name");
      }
      if (names.has(name)) {
        throw new Error("duplicated param name");
      }
      names.add(name);
    } else if (!p.trim() && i > 0 && i < pattern.length - 1) {
      throw new Error("invalid path segment");
    }
  }
  return _path => {
    const path = _path.split("/");
    if (pattern.length !== path.length) {
      return null;
    }
    const params = {};
    for (let i = 0; i < pattern.length; i++) {
      const p = pattern[i];
      if (p[0] === "{" && p[p.length - 1] === "}") {
        const name = p.slice(1, -1).trim();
        params[name] = path[i];
      } else if (p !== path[i]) {
        return null;
      }
    }
    return params;
  };
};

export class Request {
  get method(): Method {
    return this.raw.method;
  }
  get url(): string {
    return this.raw.url;
  }
  get headers(): Headers {
    return this.raw.headers;
  }
  get body(): () => Promise<Uint8Array> {
    return this.raw.body.bind(this.raw);
  }
  path: string;
  search: string;
  query: Query;
  params: Params;
  data: any;
  error?: Error;
  extra: any = {};
  constructor(public raw) {
    const url = new URL("http://a.b" + raw.url);
    this.path = url.pathname;
    this.search = url.search;
    const query = {};
    for (let [k, v] of new URLSearchParams(url.search) as any) {
      if (Array.isArray(query[k])) {
        query[k] = [...query[k], v];
      } else if (typeof query[k] === "string") {
        query[k] = [query[k], v];
      } else {
        query[k] = v;
      }
    }
    this.query = query;
  }
}

class Response {
  status = 200;
  headers = new Headers();
  body?: string | Uint8Array | Reader;
  resources: Closer[] = [];
  toHttpResponse(): http.Response {
    console.log(this.body, "body");
    let { status = 200, headers, body } = this;
    if (typeof body === "string") {
      body = new TextEncoder().encode(body);
      if (!headers.has("Content-Type")) {
        headers.append("Content-Type", "text/plain");
      }
    }
    return { status, headers, body };
  }
  close() {
    for (let resource of this.resources) {
      resource.close();
    }
  }
  async empty(status: number): Promise<void> {
    this.status = status;
  }
  async json(json: any): Promise<void> {
    this.headers.append("Content-Type", "application/json");
    this.body = JSON.stringify(json);
  }
  async file(
    filePath: string,
    transform?: (src: string) => string
  ): Promise<void> {
    const notModified = false;
    if (notModified) {
      this.status = 304;
      return;
    }
    const extname = path.extname(filePath);
    const contentType = lookup(extname.slice(1));
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      return;
    }
    this.headers.append("Content-Type", contentType);
    if (transform) {
      const bytes = await readFile(filePath);
      let str = new TextDecoder().decode(bytes);
      str = transform(str);
      this.body = new TextEncoder().encode(str);
    } else {
      const file = await open(filePath);
      this.resources.push(file);
      this.body = file;
    }
  }
}

export class App {
  middlewares: Middleware[] = [];
  async listen(port: number, host = "0.0.0.0") {
    const s = http.serve(`${host}:${port}`);
    let abort = false;
    const start = async () => {
      for await (const incoming of s) {
        if (abort) break;
        const req = new Request(incoming);
        const res = new Response();
        console.log(this.middlewares, "middlewares");
        try {
          await runMiddlewares(this.middlewares, req, res);
        } catch (e) {
          if (!res.status) {
            res.status = 500;
          }
        }
        try {
          await incoming.respond(res.toHttpResponse());
        } finally {
          res.close();
        }
      }
    }
    async function close() {
      abort = true;
    }
    await start();
    return { port, close };
  }
  private addPathHandler(method: Method, pattern: string, handle: EndHandler) {
    this.middlewares.push({
      method,
      pattern,
      match: simplePathMatcher(pattern),
      handle
    });
  }
  get(pattern, handle: EndHandler): void {
    this.addPathHandler("GET", pattern, handle);
  }
}

async function runMiddlewares(
  ms: Middleware[],
  req: Request,
  res: Response
): Promise<void> {
  if (ms.length) {
    const [m, ...rest] = ms;
    await runMiddleware(m, req, res, () => {
      return runMiddlewares(rest, req, res);
    });
  }
}
async function runMiddleware(
  m: Middleware,
  req: Request,
  res: Response,
  next: Next
): Promise<void> {
  if (isPathHandler(m)) {
    if (m.method !== req.method) {
      next();
    } else {
      const params = m.match(req.url);
      if (params) {
        req.extra.matchedPattern = m.pattern;
        req.params = params;
        await m.handle(req, res);
      } else {
        next();
      }
    }
  } else {
    await m(req, res, next);
  }
}

function isPathHandler(m: Middleware): m is PathHandler {
  return typeof m !== "function";
}