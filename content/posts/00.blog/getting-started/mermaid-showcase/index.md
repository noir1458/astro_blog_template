---
title: Mermaid diagram showcase
slug: mermaid-showcase
description: Preview flowchart, sequence, state, class, and entity relationship diagrams in one post.
publishedAt: '2026-01-12'
categories: getting-started
tags:
  - Mermaid
  - Markdown
---

This post collects several Mermaid diagram types so you can check rendering,
source disclosure, copying, responsive layout, and dark mode in one place.

## Flowchart

A flowchart is useful for a publishing workflow or decision tree.

```mermaid
flowchart LR
    Draft[Write a draft] --> Preview[Preview locally]
    Preview --> Check{Checks pass?}
    Check -->|Yes| Publish[Publish the post]
    Check -->|No| Revise[Revise the draft]
    Revise --> Preview
```

## Sequence diagram

A sequence diagram shows messages exchanged over time.

```mermaid
sequenceDiagram
    actor Reader
    participant Browser
    participant Blog
    Reader->>Browser: Open a post
    Browser->>Blog: Request static HTML
    Blog-->>Browser: Return page and assets
    Browser-->>Reader: Display the post
```

## State diagram

A state diagram works well for lifecycle documentation.

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review: Request review
    Review --> Draft: Revise
    Review --> Published: Approve
    Published --> Archived: Archive
    Archived --> [*]
```

## Class diagram

A class diagram can document the shape of related content objects.

```mermaid
classDiagram
    class Post {
        +String title
        +String slug
        +Date publishedAt
        +publish()
    }
    class Tag {
        +String name
    }
    Post "*" --> "*" Tag : uses
```

## Entity relationship diagram

An entity relationship diagram is useful for data models.

```mermaid
erDiagram
    AUTHOR ||--o{ POST : writes
    POST ||--o{ POST_TAG : has
    TAG ||--o{ POST_TAG : categorizes
    AUTHOR {
        string id PK
        string name
    }
    POST {
        string slug PK
        string title
        date publishedAt
    }
    TAG {
        string id PK
        string name
    }
    POST_TAG {
        string postSlug FK
        string tagId FK
    }
```

Try switching the site theme and narrowing the browser window. Each diagram
should remain readable, and its original source should be available underneath.
