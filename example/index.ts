import * as kobold from '../mod.ts';
import { RestController } from '../core/mvc/decorators.ts';

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
    const dummy = new DummyController(app);
    app.get("/", dummy.helloWorld);
    app.get("/other", async (req: Request, res: Response) => {
        res.json({ hello: "world" });
    });
    app.post("/postme", async (req: Request, res: Response) => {
        res.json(req.data);
    });

    await app.listen(8000, "0.0.0.0", () => console.log("port started on 8000"));
}

main();