import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";

const projectRoot = path.resolve(import.meta.dirname, "..");
const workflowPath = path.join(projectRoot, ".github/workflows/deploy.yml");
const source = fs.readFileSync(workflowPath, "utf8");
const document = parseDocument(source, {
  prettyErrors: true,
  uniqueKeys: true
});

if (document.errors.length > 0) {
  throw new Error(document.errors.map((error) => error.message).join("\n"));
}

const workflow = document.toJS({ maxAliasCount: 20 });
const errors = [];

function expect(condition, message) {
  if (!condition) errors.push(message);
}

expect(workflow?.on?.push?.branches?.includes("main"), "push must validate main");
expect(workflow?.on?.pull_request !== undefined, "pull requests must be validated");
expect(workflow?.on?.workflow_dispatch !== undefined, "manual deployment must be available");
expect(
  workflow?.permissions?.contents === "read",
  "workflow contents permission must be read-only"
);
expect(
  Object.keys(workflow?.permissions ?? {}).length === 1,
  "write permissions must not be global"
);

const build = workflow?.jobs?.build;
const deploy = workflow?.jobs?.deploy;
expect(build?.permissions?.contents === "read", "build must use contents: read");
expect(build?.permissions?.pages === "read", "build must use pages: read");
expect(
  String(build?.outputs?.["pages-enabled"]).includes("steps.pages-status.outputs.enabled"),
  "build must expose the detected Pages status"
);
expect(
  build?.steps?.some((step) => step.run === "npm run check"),
  "build must run the complete local validation"
);
const liveDemoBuild = build?.steps?.find((step) => step.name === "Build official live demo");
expect(
  liveDemoBuild?.run === "node scripts/build-live-demo.mjs",
  "the official live demo must use the isolated demo build"
);
expect(
  liveDemoBuild?.env?.ASTRO_BLOG_DEMO_URL === "https://noir1458.github.io/astro_blog_template",
  "the official live demo must use its complete project-site URL"
);
expect(
  String(liveDemoBuild?.if).includes("github.repository == 'noir1458/astro_blog_template'")
    && String(liveDemoBuild?.if).includes("github.event_name != 'pull_request'"),
  "the live-demo override must only run for non-PR builds in the official repository"
);
expect(
  build?.steps?.some(
    (step) => step.run === "npx playwright install --with-deps --only-shell chromium"
  ),
  "build must install the Chromium headless shell for Mermaid rendering"
);
const pagesStatus = build?.steps?.find((step) => step.id === "pages-status");
// biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expressions are intentionally checked as literal strings.
const githubRepositoryExpression = "${{ github.repository }}";
// biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expressions are intentionally checked as literal strings.
const githubTokenExpression = "${{ github.token }}";
// biome-ignore lint/suspicious/noTemplateCurlyInString: The workflow shell variable is intentionally checked as a literal string.
const pagesApiEndpoint = "api.github.com/repos/${GH_REPOSITORY}/pages";
expect(
  String(pagesStatus?.if).includes("github.event_name != 'pull_request'"),
  "Pages detection must be disabled for pull requests"
);
expect(
  pagesStatus?.env?.GH_REPOSITORY === githubRepositoryExpression
    && pagesStatus?.env?.GH_TOKEN === githubTokenExpression,
  "Pages detection must use the current repository and GitHub token"
);
expect(
  String(pagesStatus?.run).includes(pagesApiEndpoint)
    && String(pagesStatus?.run).includes("404)")
    && String(pagesStatus?.run).includes("enabled=false"),
  "Pages detection must skip deployment when Pages is not enabled"
);
for (const stepName of ["Configure Pages", "Upload Pages artifact"]) {
  const step = build?.steps?.find((candidate) => candidate.name === stepName);
  expect(
    String(step?.if).includes("steps.pages-status.outputs.enabled == 'true'"),
    `${stepName} must require enabled Pages`
  );
}
const liveDemoIndex = build?.steps?.indexOf(liveDemoBuild);
const uploadIndex = build?.steps?.findIndex((step) => step.name === "Upload Pages artifact");
expect(
  liveDemoIndex >= 0 && uploadIndex > liveDemoIndex,
  "the official live demo must be built before the Pages artifact is uploaded"
);
expect(deploy?.needs === "build", "deploy must depend on build");
expect(deploy?.permissions?.pages === "write", "deploy requires pages: write");
expect(deploy?.permissions?.["id-token"] === "write", "deploy requires id-token: write");
expect(
  String(deploy?.if).includes("github.event_name != 'pull_request'")
    && String(deploy?.if).includes("needs.build.outputs.pages-enabled == 'true'"),
  "deploy must be disabled for pull requests and repositories without Pages"
);
const actionReferences = Object.values(workflow?.jobs ?? {})
  .flatMap((job) => job.steps ?? [])
  .map((step) => step.uses)
  .filter(Boolean);
for (const reference of actionReferences) {
  expect(
    /@[0-9a-f]{40}$/u.test(reference),
    `action must be pinned to a full commit SHA: ${reference}`
  );
}

console.log(
  JSON.stringify(
    {
      workflow: path.relative(projectRoot, workflowPath),
      triggers: Object.keys(workflow?.on ?? {}),
      pinnedActions: actionReferences.length,
      errors
    },
    null,
    2
  )
);

if (errors.length > 0) process.exitCode = 1;
