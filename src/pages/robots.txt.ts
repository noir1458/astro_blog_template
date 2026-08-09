import type { APIRoute } from "astro";
import { FEATURES, absoluteSiteUrl, sitePath } from "@/config";

export const GET: APIRoute = () => new Response(
  [
    "User-agent: *",
    `Allow: ${sitePath("/")}`,
    ...(FEATURES.sitemap
      ? ["", `Sitemap: ${absoluteSiteUrl("/sitemap-index.xml")}`]
      : []),
    ""
  ].join("\n"),
  {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  }
);
