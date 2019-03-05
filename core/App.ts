import { http } from "../deps.ts";
import { simplePathMatcher } from './PathUtils.ts';
import Request from './Request.ts';
import Response from './Response.ts';
import { runMiddlewares, bodyParser } from './middlewares.ts';
import { Middleware, Method, EndHandler } from './types.ts';

export default class App {
    middlewares: Middleware[] = [];
    private abort = false;
    constructor() {
        this.use(bodyParser.json());
        this.use(bodyParser.urlencoded());
    }
    use(m: Middleware) {
        this.middlewares.push(m);
    }
    async listen(port: number, host = "0.0.0.0", callback?: Function) {
        const server = http.serve(`${host}:${port}`);
        let abort = false;
        const start = async () => {
            for await (const incoming of server) {
                if (abort) break;
                const req = new Request(incoming);
                const res = new Response();
                try {
                    await runMiddlewares(this.middlewares, req, res);
                } catch (e) {
                    if (!res.status) {
                        res.status = 500;
                        throw new Error(e);
                    }
                }
                try {
                    await incoming.respond(res.toHttpResponse());
                } finally {
                    res.close();
                }
            }
            console.log(server, abort);
        }
        async function close() {
            abort = true;
        }
        callback && callback();
        start();
        return { close };
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
    post(pattern, handle: EndHandler): void {
        this.addPathHandler("POST", pattern, handle);
    }
    put(pattern, handle: EndHandler): void {
        this.addPathHandler("PUT", pattern, handle);
    }
    patch(pattern, handle: EndHandler): void {
        this.addPathHandler("PATCH", pattern, handle);
    }
    delete(pattern, handle: EndHandler): void {
        this.addPathHandler("DELETE", pattern, handle);
    }
}