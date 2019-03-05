# Kobold. An API Framework for Deno
##### Work in Progress: Use at your own risk.
[![Build Status](https://travis-ci.org/spkellydev/kobold.svg?branch=master)](https://travis-ci.org/spkellydev/kobold)
Kobold is an Express like framework for building web applications. The goal of the project is to project a fully functional MVC framework for Deno with provides a familiar and easy interface for web programming.

### Example App
`see ./example for a working implementation`
All imports are available in `mod.ts`, to which you can import all in one shot under the **kobold** variable, or as separate imports.
Example:
```ts
import * as kobold from '../mod.ts';
```
```ts
import { App, Request, Response } from '../mod.ts';
```

Creating a simple app is easy enough.
```ts
class DummyController implements kobold.KoboldController {
    constructor(private app: kobold.App) {}

    helloWorld = async (req: Request, res: Response) => {
        res.json({ hello: "world" });
    }
}

async function main() {
    const app = new kobold.App();
    const dummy = new DummyController(app);
    app.get("/", dummy.helloWorld);
    app.get("/other", async (req: Request, res: Response) => {
        res.json({ hello: "world" });
    });
    app.post("/postme", async (req: Request, res: Response) => {
        /** echo **/
        res.json(req.data);
    });

    /** app.listen(port: number, host: string, callback ?: Function) **/
    /** The callback function is executed BEFORE the server is started; console.log is the only recommended approach **/
    await app.listen(8000, "0.0.0.0", () => console.log("port started on 8000"));
}

main();
```