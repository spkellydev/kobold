import * as kolbold from '../mod.ts';

type Request = kolbold.Request;
type Response = kolbold.Response;

async function main() {
    const app = new kolbold.App();
    app.get("/", async (req: Request, res: Response) => {
        res.json({ hello : "world" });
    });
    app.get("/other", async (req: Request, res: Response) => {
        res.json({ hello: "world" });
    });
    app.post("/postme", async (req: Request, res: Response) => {
        res.json(req.data);
    });

    await app.listen(8000, "0.0.0.0", () => console.log("port started on 8000"));
}

main();