import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { snapshot, verify } from "./translation-safety.mjs";
import { SITE, SUPPORTED_LANGUAGE_CODES } from "../src/config.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const postsRoot = path.join(projectRoot, "content/posts");

function languageFilename(language) {
  return language === SITE.language ? "index.md" : `${language}.md`;
}

function fixture(name, sourceLanguage = SITE.language) {
  const directory = fs.mkdtempSync(path.join(postsRoot, `.translation-test-${name}-`));
  const sourcePath = path.join(directory, languageFilename(sourceLanguage));
  const languageMetadata =
    sourceLanguage === SITE.language ? "" : `translationKey: test-post\nlang: ${sourceLanguage}\n`;
  const source = `---
title: 테스트 글
slug: test-post
${languageMetadata}publishedAt: '2026-08-02'
categories: blog
math: true
---

## 제목

[링크](https://example.com)와 \`inline()\`이다.

\`\`\`js
const value = 1;
\`\`\`

$$x^2 + y^2$$
`;
  fs.writeFileSync(sourcePath, source);
  return {
    directory,
    sourcePath,
    relative: path.relative(projectRoot, sourcePath),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
  };
}

function translation(language, overrides = {}) {
  const code = overrides.code ?? "const value = 1;";
  const url = overrides.url ?? "https://example.com";
  const math = overrides.math ?? "x^2 + y^2";
  return `---
title: ${language === "ko" ? "테스트 글" : language === "en" ? "Test Post" : "テスト記事"}
slug: test-post
translationKey: test-post
lang: ${language}
description: Translation fixture.
publishedAt: '2026-08-02'
categories: blog
math: true
---

## ${language === "ko" ? "제목" : language === "en" ? "Heading" : "見出し"}

[${language === "ko" ? "링크" : language === "en" ? "Link" : "リンク"}](${url}) and \`inline()\`.

\`\`\`js
${code}
\`\`\`

$$${math}$$
`;
}

test("valid translations pass", () => {
  const item = fixture("valid");
  try {
    const before = snapshot(item.relative);
    for (const language of before.targetLanguages) {
      fs.writeFileSync(
        path.join(item.directory, languageFilename(language)),
        translation(language)
      );
    }
    assert.deepEqual(verify(item.relative, before.sourceHash).errors, []);
  } finally {
    item.cleanup();
  }
});

test("a non-default source fills every other language slot", () => {
  const sourceLanguage = SUPPORTED_LANGUAGE_CODES.find((language) => language !== SITE.language);
  assert.ok(sourceLanguage);
  const item = fixture("non-default", sourceLanguage);
  try {
    const before = snapshot(item.relative);
    assert.deepEqual(
      before.targetLanguages,
      SUPPORTED_LANGUAGE_CODES.filter((language) => language !== sourceLanguage)
    );
    for (const language of before.targetLanguages) {
      fs.writeFileSync(
        path.join(item.directory, languageFilename(language)),
        translation(language)
      );
    }
    assert.deepEqual(verify(item.relative, before.sourceHash).errors, []);
  } finally {
    item.cleanup();
  }
});

test("the default language always uses index.md", () => {
  const item = fixture("default-filename");
  try {
    const before = snapshot(item.relative);
    assert.equal(path.basename(item.sourcePath), "index.md");
    assert.equal(before.sourceLanguage, SITE.language);
  } finally {
    item.cleanup();
  }
});

test("a changed source is rejected", () => {
  const item = fixture("source");
  try {
    const before = snapshot(item.relative);
    fs.appendFileSync(item.sourcePath, "\n원문 변경\n");
    for (const language of before.targetLanguages) {
      fs.writeFileSync(
        path.join(item.directory, languageFilename(language)),
        translation(language)
      );
    }
    assert.match(verify(item.relative, before.sourceHash).errors.join("\n"), /source changed/u);
  } finally {
    item.cleanup();
  }
});

test("changed code, math, and destinations are rejected", () => {
  const item = fixture("structure");
  try {
    const before = snapshot(item.relative);
    const [changedLanguage, ...remainingLanguages] = before.targetLanguages;
    fs.writeFileSync(
      path.join(item.directory, languageFilename(changedLanguage)),
      translation(changedLanguage, {
        code: "const value = 2;",
        math: "x^2 - y^2",
        url: "https://invalid.example"
      })
    );
    for (const language of remainingLanguages) {
      fs.writeFileSync(
        path.join(item.directory, languageFilename(language)),
        translation(language)
      );
    }
    const errors = verify(item.relative, before.sourceHash).errors.join("\n");
    assert.match(errors, /fenced code blocks/u);
    assert.match(errors, /math expressions/u);
    assert.match(errors, /link and image destinations/u);
  } finally {
    item.cleanup();
  }
});

test("missing translation and mismatched metadata are rejected", () => {
  const item = fixture("metadata");
  try {
    const before = snapshot(item.relative);
    const [writtenLanguage] = before.targetLanguages;
    fs.writeFileSync(
      path.join(item.directory, languageFilename(writtenLanguage)),
      translation(writtenLanguage).replace("translationKey: test-post", "translationKey: wrong")
    );
    const errors = verify(item.relative, before.sourceHash).errors.join("\n");
    assert.match(errors, /translationKey must be test-post/u);
    assert.match(errors, /translation file is missing/u);
  } finally {
    item.cleanup();
  }
});
