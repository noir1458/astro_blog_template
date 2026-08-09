import rss from "@astrojs/rss";
import { FEATURES, SITE, absoluteSiteUrl } from "@/config";
import { getPublishedPosts, postDescription, postUrl } from "@/utils/content";

export function getStaticPaths() {
  return FEATURES.rss ? [{ params: { feed: "rss" } }] : [];
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  })[character] ?? character);
}

export async function GET() {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(absoluteSiteUrl("/")),
    items: posts.map((post) => ({
      title: post.data.title,
      description: postDescription(post),
      pubDate: post.data.publishedAt,
      link: postUrl(post),
      customData: `<dc:creator>${escapeXml(SITE.author.name)}</dc:creator>`,
      categories: post.data.categories
    })),
    xmlns: {
      dc: "http://purl.org/dc/elements/1.1/"
    },
    customData:
      `<language>${escapeXml(SITE.language)}</language>`
      + `<dc:creator>${escapeXml(SITE.author.name)}</dc:creator>`
  });
}
