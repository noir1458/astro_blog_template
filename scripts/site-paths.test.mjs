import assert from "node:assert/strict";
import test from "node:test";
import {
  prefixSitePath,
  siteBasePath
} from "../src/lib/config/sitePaths.ts";

test("the site base path is derived from the configured public URL", () => {
  assert.equal(siteBasePath("https://username.github.io"), "");
  assert.equal(siteBasePath("https://username.github.io/example-blog"), "/example-blog");
  assert.equal(siteBasePath("https://example.com/nested/blog/"), "/nested/blog");
});

test("internal paths receive the base path exactly once", () => {
  assert.equal(prefixSitePath("/", "/example-blog"), "/example-blog/");
  assert.equal(prefixSitePath("/posts/welcome/", "/example-blog"), "/example-blog/posts/welcome/");
  assert.equal(prefixSitePath("/example-blog/posts/welcome/", "/example-blog"), "/example-blog/posts/welcome/");
  assert.equal(prefixSitePath("https://example.com", "/example-blog"), "https://example.com");
  assert.equal(prefixSitePath("#content", "/example-blog"), "#content");
});
