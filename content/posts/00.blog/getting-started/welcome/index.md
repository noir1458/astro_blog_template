---
title: Welcome to your new blog
slug: welcome
description: Learn which folders to edit and publish your first Astro blog post.
publishedAt: '2026-01-15'
categories: getting-started
tags:
  - Astro
  - Blogging
---

This starter keeps customization focused on three places: `config/`, `content/`,
and `public/images/`.

![alt text](image.png)

```mermaid
flowchart LR
    Config["config/"] --> Build["Astro build"]
    Content["content/"] --> Build
    Images["public/images/"] --> Build
    Build --> Blog["Your blog on GitHub Pages"]
```

Continue with the [Markdown guide](/posts/markdown-guide/) or visit the
[Astro documentation](https://docs.astro.build/) for advanced customization.
