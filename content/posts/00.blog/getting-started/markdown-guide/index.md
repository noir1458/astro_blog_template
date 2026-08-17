---
title: Markdown writing guide
slug: markdown-guide
description: A compact example of headings, code, links, tags, and math in a post.
publishedAt: '2026-01-10'
categories: getting-started
tags:
  - Markdown
math: true
---

## Headings and links

Use headings to organize a post. Link to the [welcome post](/posts/welcome/) or an
[external reference](https://www.markdownguide.org/).

## Code

```js
const greeting = "Hello, blog!";
console.log(greeting);
```

## Math

Inline math looks like $E = mc^2$. Display math uses a separate block:

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
$$

## Mermaid diagrams

Use a `mermaid` fenced code block. Select the code icon (`</>`) in the rendered diagram's
top-right corner to inspect and copy the source in a centered modal.

```mermaid
flowchart LR
    A[Write Markdown] --> B[Build with Astro]
    B --> C[Show diagram]
```

See the [Mermaid diagram showcase](/posts/mermaid-showcase/) for flowchart,
sequence, state, class, and entity relationship examples.
