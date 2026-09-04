import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "astro-blog-base-path-"));
const configDirectory = path.join(temporaryRoot, "config");
const outputDirectory = path.join(temporaryRoot, "dist");
const astroEntry = path.join(projectRoot, "node_modules/astro/bin/astro.mjs");
const basePath = "/astro_blog_template";
const siteUrl = `https://noir1458.github.io${basePath}`;

try {
  fs.cpSync(path.join(projectRoot, "config"), configDirectory, { recursive: true });
  const siteConfigPath = path.join(configDirectory, "site.yaml");
  const siteConfig = fs
    .readFileSync(siteConfigPath, "utf8")
    .replace("https://username.github.io", siteUrl)
    .replace("    position: center", "    position: bottom")
    .replace("    height: 600", "    height: 640")
    .replace("    mobileHeight: 420", "    mobileHeight: 360")
    .replace("    overlayOpacity: 0.18", "    overlayOpacity: 0.24");
  fs.writeFileSync(siteConfigPath, siteConfig);

  const build = spawnSync(process.execPath, [astroEntry, "build", "--outDir", outputDirectory], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ASTRO_BLOG_CONFIG_DIR: configDirectory
    }
  });

  if (build.status !== 0) {
    process.stdout.write(build.stdout ?? "");
    process.stderr.write(build.stderr ?? "");
    throw new Error(`base-path build exited with status ${build.status}`);
  }

  const indexHtml = fs.readFileSync(path.join(outputDirectory, "index.html"), "utf8");
  const postHtml = fs.readFileSync(path.join(outputDirectory, "posts/welcome/index.html"), "utf8");
  const representativePages = new Map([
    ["index.html", indexHtml],
    ["posts/welcome/index.html", postHtml],
    [
      "categories/index.html",
      fs.readFileSync(path.join(outputDirectory, "categories/index.html"), "utf8")
    ],
    ["tags/index.html", fs.readFileSync(path.join(outputDirectory, "tags/index.html"), "utf8")],
    [
      "archives/index.html",
      fs.readFileSync(path.join(outputDirectory, "archives/index.html"), "utf8")
    ],
    ["about/index.html", fs.readFileSync(path.join(outputDirectory, "about/index.html"), "utf8")],
    ["search/index.html", fs.readFileSync(path.join(outputDirectory, "search/index.html"), "utf8")],
    [
      "projects/example-project/index.html",
      fs.readFileSync(path.join(outputDirectory, "projects/example-project/index.html"), "utf8")
    ]
  ]);
  const rootRelativeAttributes = [
    ...[...representativePages.values()].join("\n").matchAll(/\b(?:href|src|action)="(\/[^"]*)"/gu)
  ].map((match) => match[1]);
  const unprefixedAttributes = rootRelativeAttributes.filter(
    (value) => value !== `${basePath}/` && !value.startsWith(`${basePath}/`)
  );

  assert.deepEqual(unprefixedAttributes, []);
  assert.match(indexHtml, new RegExp(`href="${basePath}/posts/welcome/"`, "u"));
  assert.match(indexHtml, /class="hero-banner"/u);
  assert.match(indexHtml, /class="has-hero-background"/u);
  assert.match(indexHtml, new RegExp(`src="${basePath}/images/site/banner\\.webp"`, "u"));
  assert.match(indexHtml, /--banner-height: 640px/u);
  assert.match(indexHtml, /--banner-mobile-height: 360px/u);
  assert.match(indexHtml, /--banner-overlay-opacity: 0\.24/u);
  assert.match(indexHtml, /--banner-position: bottom/u);
  for (const [page, html] of representativePages) {
    assert.equal(
      (html.match(/class="hero-banner"/gu) ?? []).length,
      1,
      `${page} should render exactly one banner`
    );
    assert.equal(
      (html.match(/class="has-hero-background"/gu) ?? []).length,
      1,
      `${page} should render exactly one hero body class`
    );
    assert.equal(
      (html.match(new RegExp(`src="${basePath}/images/site/banner\\.webp"`, "gu")) ?? []).length,
      1,
      `${page} should resolve exactly one banner image through the base path`
    );
  }
  assert.match(postHtml, new RegExp(`href="${basePath}/posts/markdown-guide/"`, "u"));
  assert.match(postHtml, new RegExp(`src="${basePath}/_astro/`, "u"));
  assert.match(indexHtml, new RegExp(`https://noir1458\\.github\\.io${basePath}/`));

  const rss = fs.readFileSync(path.join(outputDirectory, "rss.xml"), "utf8");
  const robots = fs.readFileSync(path.join(outputDirectory, "robots.txt"), "utf8");
  const sitemap = fs.readFileSync(path.join(outputDirectory, "sitemap-0.xml"), "utf8");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDirectory, "manifest.webmanifest"), "utf8")
  );

  assert.match(rss, new RegExp(`<link>${siteUrl}/</link>`, "u"));
  assert.match(rss, new RegExp(`<link>${siteUrl}/posts/welcome/</link>`, "u"));
  assert.match(robots, new RegExp(`Allow: ${basePath}/`, "u"));
  assert.match(robots, new RegExp(`Sitemap: ${siteUrl}/sitemap-index\\.xml`, "u"));
  assert.match(sitemap, new RegExp(`<loc>${siteUrl}/posts/welcome/</loc>`, "u"));
  assert.equal(manifest.start_url, `${basePath}/`);
  assert.equal(manifest.scope, `${basePath}/`);
  assert.equal(manifest.icons[0].src, `${basePath}/images/site/favicon.png`);

  const builtScripts = fs
    .readdirSync(path.join(outputDirectory, "_astro"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => fs.readFileSync(path.join(outputDirectory, "_astro", name), "utf8"))
    .join("\n");
  assert.match(builtScripts, new RegExp(`${basePath}/sw\\.js`, "u"));
  assert.match(builtScripts, /updateViaCache:\s*[`"']none[`"']/u);
  assert.match(builtScripts, /\.update\(\)/u);

  const serviceWorker = fs.readFileSync(path.join(outputDirectory, "sw.js"), "utf8");
  assert.match(serviceWorker, /new URL\("404\.html", SCOPE_URL\)/u);
  assert.match(serviceWorker, /ASTRO_ASSET_PATH = `\$\{SCOPE_URL\.pathname\}_astro\/`/u);
  assert.match(serviceWorker, /CACHE_NAMESPACE = `astro-blog:\$\{SCOPE_KEY\}:`/u);
  assert.match(serviceWorker, /CACHE_NAME = `\$\{CACHE_NAMESPACE\}v6`/u);
  assert.doesNotMatch(serviceWorker, /const CORE = \["\/"/u);

  console.log(
    JSON.stringify(
      {
        siteUrl,
        checkedRootRelativeAttributes: rootRelativeAttributes.length,
        rss: true,
        sitemap: true,
        manifest: true,
        scopedServiceWorker: true,
        siteWideBanner: true,
        errors: []
      },
      null,
      2
    )
  );
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
