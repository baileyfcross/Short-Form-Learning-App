# Neo4j Graph And Vector Schema

## Core Nodes

- `User`: account identity, roles, preferences, and timestamps.
- `Material`: uploaded textbooks, PDFs, videos, audio, images, notes, and documents. Stores metadata and object storage references only.
- `TranscriptChunk`: extracted text/transcript chunk with an embedding vector.
- `Snippet`: short public or private lesson candidate generated from material or created manually.
- `Fact`: normalized claim extracted from a snippet or chunk.
- `Source`: trusted/admin-entered source metadata and cited source references.
- `Topic`, `Tag`, `Subject`: content organization and recommendation signals.
- `ModerationReview`: moderation decision record.
- `Report`: user report record.

## Core Relationships

- `(:User)-[:USER_UPLOADED_MATERIAL]->(:Material)`
- `(:Material)-[:MATERIAL_HAS_CHUNK]->(:TranscriptChunk)`
- `(:Material)-[:MATERIAL_GENERATED_SNIPPET]->(:Snippet)`
- `(:Snippet)-[:SNIPPET_CONTAINS_FACT]->(:Fact)`
- `(:Fact)-[:FACT_SUPPORTED_BY_SOURCE]->(:Source)`
- `(:Fact)-[:FACT_CONFLICTS_WITH_SOURCE]->(:Source)`
- `(:Fact)-[:FACT_RELATED_TO_TOPIC]->(:Topic)`
- `(:User)-[:USER_SAVED_MATERIAL]->(:Material)`
- `(:User)-[:USER_VIEWED_SNIPPET]->(:Snippet)`
- `(:User)-[:USER_LIKED_SNIPPET]->(:Snippet)`
- `(:User)-[:USER_REPORTED_SNIPPET]->(:Snippet)`
- `(:User)-[:ADMIN_REVIEWED_SNIPPET]->(:Snippet)`

## Constraints And Indexes

```cypher
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT material_id IF NOT EXISTS FOR (m:Material) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT snippet_id IF NOT EXISTS FOR (s:Snippet) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT fact_id IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT report_id IF NOT EXISTS FOR (r:Report) REQUIRE r.id IS UNIQUE;

CREATE INDEX material_subject IF NOT EXISTS FOR (m:Material) ON (m.subject);
CREATE INDEX snippet_moderation IF NOT EXISTS FOR (s:Snippet) ON (s.moderationStatus);
CREATE INDEX snippet_subject IF NOT EXISTS FOR (s:Snippet) ON (s.subject);
CREATE INDEX fact_verification IF NOT EXISTS FOR (f:Fact) ON (f.verificationStatus);
```

## Vector Indexes

Use the same embedding dimension as the selected provider. The mock embedding service uses 32 dimensions, but production models commonly use larger dimensions.

```cypher
CREATE VECTOR INDEX transcript_chunk_embedding IF NOT EXISTS
FOR (c:TranscriptChunk) ON (c.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
};

CREATE VECTOR INDEX snippet_embedding IF NOT EXISTS
FOR (s:Snippet) ON (s.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
};

CREATE VECTOR INDEX fact_embedding IF NOT EXISTS
FOR (f:Fact) ON (f.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
};
```

## Admin-Only Reliability

`reliabilityScore` is stored on `Material`, `Snippet`, and `Source` nodes. Backend response mapping strips it from normal library and feed responses. Admin routes return admin snippet records with reliability fields.
