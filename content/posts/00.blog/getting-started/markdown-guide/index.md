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

```md
## Section heading
### Subsection heading
#### Detail heading
```

### Third-level heading

This `h3` heading is styled as a subsection and is included in **On this page**.

#### Fourth-level heading

This `h4` heading is a smaller detail heading and is intentionally omitted from
**On this page**.

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
erDiagram
    BLOG_AUTHOR ||--o{ BLOG_POST : writes
    CATEGORY ||--o{ BLOG_POST : contains
    BLOG_POST ||--o{ COMMENT : receives
    BLOG_POST ||--o{ POST_TAG : has
    TAG ||--o{ POST_TAG : maps

    BLOG_AUTHOR {
        string id PK
        string name
        string email UK
    }
    CATEGORY {
        string id PK
        string name UK
    }
    BLOG_POST {
        string id PK
        string authorId FK
        string categoryId FK
        string slug UK
        string title
        datetime publishedAt
    }
    COMMENT {
        string id PK
        string postId FK
        string authorName
        string body
        datetime createdAt
    }
    TAG {
        string id PK
        string name UK
    }
    POST_TAG {
        string postId PK, FK
        string tagId PK, FK
    }
```

See the [Mermaid diagram showcase](/posts/mermaid-showcase/) for flowchart,
sequence, state, class, and entity relationship examples.
