import * as kobold from '../mod.ts';
import { path } from '../deps.ts';
type Request = kobold.Request;
type Response = kobold.Response;

class DummyController implements kobold.KoboldController {
    constructor(private app: kobold.App) {}

    helloWorld = async (req: Request, res: Response) => {
        res.json({ hello: "world" });
    }
}

async function main() {
    const app = new kobold.App();
    let dir = path.resolve("./example/public")
    app.use(kobold.use_static(dir))
    const dummy = new DummyController(app);
    app.get("/api", dummy.helloWorld);
    app.get("/other", async (req: Request, res: Response) => {
        res.json({ hello: "world" });
    });
    app.post("/postme", async (req: Request, res: Response) => {
        res.json(req.data);
    });

    await app.listen(8000, "0.0.0.0", () => console.log("port started on 8000"));
}

kobold.Main(main);
