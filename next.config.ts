import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = "/fake-youtube-prop";

const nextConfig: NextConfig = {
  // GitHub Pages 빌드에서만 정적 export와 저장소 하위 경로를 적용한다.
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? githubPagesBasePath : "",
  assetPrefix: isGithubPages ? githubPagesBasePath : "",
  trailingSlash: isGithubPages,
};

export default nextConfig;
