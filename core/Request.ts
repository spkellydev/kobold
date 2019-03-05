import { Params, Method, Query } from './types.ts';
export default class Request {
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