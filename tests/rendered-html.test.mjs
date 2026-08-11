import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
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
  const [page, settingsModel, settingsPage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/prop-settings.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/settings/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(settingsModel, /triggerCount: 45/);
  assert.match(settingsModel, /좀 지루해요/);
  assert.match(settingsModel, /triggerCount: 100/);
  assert.match(settingsModel, /delaySeconds: 3/);
  assert.match(settingsModel, /pausedAtSeconds: 3/);
  assert.match(settingsModel, /showPlayButton: false/);
  assert.match(settingsModel, /likeCount: 12/);
  assert.match(settingsModel, /dislikeCount: 0/);
  assert.match(settingsModel, /#초등학생/);
  assert.match(settingsModel, /stored\.hashtags === LEGACY_DEFAULT_HASHTAGS/);
  assert.match(page, /setTimeout/);
  assert.match(page, /description-sheet/);
  assert.match(page, /settings\.showPlayButton/);
  assert.match(page, /settings\.likeCount/);
  assert.match(page, /settings\.dislikeCount/);
  assert.doesNotMatch(page, /화면의 빈 곳을 한 번 터치하면/);
  assert.doesNotMatch(page, /settings-entry/);
  assert.match(page, /href="\/settings" aria-label="프로필 및 촬영 설정"/);
  assert.match(settingsPage, /댓글과 등장 타이밍/);
  assert.match(settingsPage, /영상이 멈춘 시점/);
  assert.match(settingsPage, /좋아요 수/);
  assert.match(settingsPage, /싫어요 수/);
  assert.match(settingsPage, /applySceneStart\(45\)/);
  assert.match(settingsPage, /applySceneStart\(97\)/);
  assert.match(settingsPage, /requestFullscreen/);
  assert.match(page, /viewCount: current\.viewCount \+ 1/);
  assert.match(settingsModel, /localStorage/);
});

test("별도 촬영 설정 페이지를 렌더링한다", async () => {
  const response = await render("/settings");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /촬영 설정/);
  assert.match(html, /영상 정보/);
  assert.match(html, /등장 조회수/);
  assert.match(html, /45회로 초기화/);
  assert.match(html, /97회로 초기화/);
  assert.match(html, /좋아요 수/);
  assert.match(html, /싫어요 수/);
});

test("진행률 원 마커가 영상 하단에서 잘리지 않는다", async () => {
  const [stylesheet, standaloneTemplate] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../standalone/viewtube-prop.template.html", import.meta.url), "utf8"),
  ]);

  assert.match(stylesheet, /\.video-stage\s*\{[\s\S]*?margin-bottom:\s*8px;[\s\S]*?overflow:\s*visible;/);
  assert.match(standaloneTemplate, /\.video\{[^}]*margin-bottom:8px;[^}]*overflow:visible;/);
});

test("단일 HTML에 썸네일과 촬영 기능을 모두 포함한다", async () => {
  const html = await readFile(new URL("../standalone/viewtube-prop.html", import.meta.url), "utf8");

  assert.match(html, /data:image\/webp;base64,/);
  assert.match(html, /viewtube-prop-standalone-v1/);
  assert.match(html, /좀 지루해요/);
  assert.match(html, /하나도 안 웃김/);
  assert.match(html, /#초등학생/);
  assert.match(html, /id="filmLikes"/);
  assert.match(html, /id="filmDislikes"/);
  assert.match(html, /id="reset45"/);
  assert.match(html, /id="reset97"/);
  assert.match(html, /requestFullscreen/);
  assert.doesNotMatch(html, /__THUMBNAIL_DATA_URL__/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
});
