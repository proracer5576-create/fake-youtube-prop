import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const templatePath = resolve(projectRoot, "standalone/viewtube-prop.template.html");
const thumbnailPath = resolve(projectRoot, "public/movie-thumbnail.webp");
const outputPath = resolve(projectRoot, "standalone/viewtube-prop.html");

try {
  const [template, thumbnail] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(thumbnailPath),
  ]);
  const thumbnailDataUrl = `data:image/webp;base64,${thumbnail.toString("base64")}`;
  const output = template.replace("__THUMBNAIL_DATA_URL__", thumbnailDataUrl);

  if (output.includes("__THUMBNAIL_DATA_URL__")) {
    throw new Error("썸네일 자리표시자 치환에 실패했습니다.");
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  console.log(outputPath);
} catch (error) {
  console.error("단일 HTML 생성 실패:", error);
  process.exitCode = 1;
}
