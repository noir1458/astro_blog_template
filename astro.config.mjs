import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { FEATURES, SITE } from "./src/config.ts";
import { rehypeSitePaths } from "./src/lib/markdown/rehypeSitePaths.ts";

export default defineConfig({
  site: SITE.origin,
  base: SITE.basePath || "/",
  output: "static",
  trailingSlash: "always",
  integrations: FEATURES.sitemap
    ? [sitemap({
      filter: (page) => !new URL(page).pathname.endsWith("/search/")
    })]
    : [],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        [rehypeKatex, { output: "htmlAndMathml", strict: false }],
        [rehypeSitePaths, { basePath: SITE.basePath }]
      ]
    }),
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha"
      },
      wrap: true
    }
  },
  vite: {
    build: {
      cssMinify: "lightningcss"
    }
  }
});
