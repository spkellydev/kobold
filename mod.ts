import { serve } from './deps.ts';

const s = serve("0.0.0.0:8000");

export async function main() {
  for await (const req of s) {
    req.respond({ body: new TextEncoder().encode("Hello World\n") });
  }
}
