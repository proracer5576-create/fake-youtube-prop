import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  // 실제 D1 바인딩은 배포 환경에서 주입되므로 선택 필드로 안전하게 좁힌다.
  const workerEnv = env as unknown as { DB?: D1Database };
  if (!workerEnv.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(workerEnv.DB, { schema });
}
