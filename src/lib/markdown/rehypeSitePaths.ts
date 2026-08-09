import type { Root } from "hast";
import { prefixSitePath } from "../config/sitePaths.ts";

interface RehypeSitePathsOptions {
  basePath: string;
}

export function rehypeSitePaths({ basePath }: RehypeSitePathsOptions) {
  return (tree: Root) => {
    function visit(node: Root | Root["children"][number]): void {
      if ("properties" in node && node.properties) {
        for (const property of ["href", "src"] as const) {
          const value = node.properties[property];
          if (typeof value === "string") {
            node.properties[property] = prefixSitePath(value, basePath);
          }
        }
      }
      if ("children" in node) node.children.forEach(visit);
    }

    visit(tree);
  };
}
