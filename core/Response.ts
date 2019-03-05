import {
    stat,
    open,
    readFile,
    Reader,
    Closer
} from "deno";
import { path, http, lookup } from "../deps.ts";

export default class Response {
    status = 200;
    headers = new Headers();
    body?: string | Uint8Array | Reader;
    resources: Closer[] = [];
    toHttpResponse(): http.Response {
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
