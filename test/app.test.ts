import {
    runTests,
    test,
    assert,
    equal
} from "https://deno.land/x/testing/mod.ts";
import { App, Request, Response } from '../mod.ts';

const dummyRequest = async (req: Request, res: Response) => {
    res.json({ hello: "world" });
}

/**
 * Test that the app can launch.
 */
test(async function app_launches() {
    const app = new App();
    app.get("/", dummyRequest);
    app.listen(4000, "0.0.0.0");
    const res = await fetch("http://localhost:4000/");
    assert(equal(200, res.status));
    assert(equal({ hello: "world" }, await res.json()));
});



runTests();