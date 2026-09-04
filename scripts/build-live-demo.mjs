import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseDocument } from "yaml";

const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "astro-blog-live-demo-"));
const configDirectory = path.join(temporaryRoot, "config");
const cacheDirectory = path.join(temporaryRoot, "cache");
const siteConfigPath = path.join(configDirectory, "site.yaml");
const demoUrl = process.env.ASTRO_BLOG_DEMO_URL;

if (!demoUrl) throw new Error("ASTRO_BLOG_DEMO_URL is required for the live-demo build.");

try {
  fs.cpSync(path.join(projectRoot, "config"), configDirectory, { recursive: true });
  const document = parseDocument(fs.readFileSync(siteConfigPath, "utf8"), {
    prettyErrors: true,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("\n"));
  }

  document.setIn(["site", "url"], demoUrl);
  fs.writeFileSync(siteConfigPath, document.toString());

  const build = spawnSync("npm", ["run", "build"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      ASTRO_BLOG_CACHE_DIR: cacheDirectory,
      ASTRO_BLOG_CONFIG_DIR: configDirectory
    },
    shell: process.platform === "win32",
    stdio: "inherit"
  });
  if (build.status !== 0) process.exitCode = build.status ?? 1;
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
