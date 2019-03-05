import { isPathHandler } from './PathUtils.ts';
import { Middleware, Next } from './types.ts';
import Request from './Request.ts';
import Response from './Response.ts';

export async function runMiddlewares(
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
export async function runMiddleware(
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
                // 404?
                next();
            }
        }
    } else {
        await m(req, res, next);
    }
}

export const bodyParser = {
    json(): Middleware {
        return async (req, res, next) => {
            if (req.headers.get("Content-Type") === "application/json") {
                try {
                    const body = await req.body();
                    const text = new TextDecoder().decode(body);
                    req.data = JSON.parse(text);
                } catch (e) {
                    res.status = 400;
                    req.error = e;
                    return;
                }
            }
            await next();
        };
    },
    urlencoded(): Middleware {
        return async (req, res, next) => {
            if (
                req.headers.get("Content-Type") === "application/x-www-form-urlencoded"
            ) {
                try {
                    const body = await req.body();
                    const text = new TextDecoder().decode(body);
                    const data = {};
                    for (let s of text.split("&")) {
                        const result = /^(.+?)=(.*)$/.exec(s);
                        if (result.length < 3) {
                            continue;
                        }
                        const key = decodeURIComponent(result[1].replace("+", " "));
                        const value = decodeURIComponent(result[2].replace("+", " "));
                        if (Array.isArray(data[key])) {
                            data[key] = [...data[key], value];
                        } else if (data[key]) {
                            data[key] = [data[key], value];
                        } else {
                            data[key] = value;
                        }
                    }
                    req.data = data;
                } catch (e) {
                    res.status = 400;
                    req.error = e;
                    return;
                }
            }
            await next();
        };
    }
};