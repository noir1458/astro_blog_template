import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", ".astro", "dist", "node_modules"]);
const forbiddenPaths = [
  "archive/migration",
  "public/assets/img",
  "tests/baselines/legacy-post-routes.txt"
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const violations = [];
const files = walk(projectRoot);
for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(path.join(projectRoot, relativePath))) {
    violations.push({ file: relativePath, value: "personal-blog-only path" });
  }
}

console.log(
  JSON.stringify(
    {
      scannedFiles: files.length,
      forbiddenPersonalBlogPaths: forbiddenPaths.length,
      violations
    },
    null,
    2
  )
);

if (violations.length > 0) process.exitCode = 1;
