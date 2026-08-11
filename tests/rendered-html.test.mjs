import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("촬영용 동영상 화면을 서버에서 렌더링한다", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ViewTube 촬영용 화면<\/title>/i);
  assert.match(html, /발표할 때 심장 안 떨리는 꿀팁!/);
  assert.match(html, /조회수/);
  assert.match(html, /촬영 설정/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("100회 댓글 등장과 전체화면 제어 코드를 포함한다", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /settings\.viewCount >= 100/);
  assert.match(page, /솔직히 재미없어요/);
  assert.match(page, /requestFullscreen/);
  assert.match(page, /viewCount: current\.viewCount \+ 1/);
  assert.match(page, /localStorage/);
});
