# Sample Outputs

These examples are safe to include with the Peblo submission. They show the expected shape of the app without exposing credentials or real user data.

## Create Note Response

```json
{
  "id": "clw_note_001",
  "title": "Sprint Planning Notes",
  "content": "Discussed onboarding polish, AI summaries, and public sharing.",
  "category": "product",
  "archived": false,
  "isPublic": false,
  "tags": [
    { "id": "tag_001", "name": "planning" },
    { "id": "tag_002", "name": "ai" }
  ],
  "createdAt": "2026-05-16T08:30:00.000Z",
  "updatedAt": "2026-05-16T08:34:00.000Z"
}
```

## AI Generation Response

```json
{
  "note": {
    "id": "clw_note_001",
    "aiSummary": "The note captures sprint planning priorities around onboarding, AI summaries, sharing, and dashboard polish.",
    "aiActions": "[\"Finalize note editor polish\", \"Record demo video\", \"Add sample outputs to README\"]",
    "aiUsedCount": 1
  },
  "suggested_title": "Sprint Planning and Product Polish"
}
```

## Insights Response

```json
{
  "totalNotes": 12,
  "archivedNotes": 3,
  "aiUsage": 8,
  "weeklyActivity": 5,
  "topTags": [
    { "name": "planning", "count": 4 },
    { "name": "ai", "count": 3 }
  ],
  "weeklyBreakdown": [
    { "date": "2026-05-10", "label": "Sun", "count": 0 },
    { "date": "2026-05-11", "label": "Mon", "count": 1 },
    { "date": "2026-05-12", "label": "Tue", "count": 0 },
    { "date": "2026-05-13", "label": "Wed", "count": 2 },
    { "date": "2026-05-14", "label": "Thu", "count": 1 },
    { "date": "2026-05-15", "label": "Fri", "count": 0 },
    { "date": "2026-05-16", "label": "Sat", "count": 1 }
  ]
}
```

## Public Share Response

```json
{
  "id": "clw_note_001",
  "title": "Sprint Planning and Product Polish",
  "isPublic": true,
  "shareId": "a1b2c3d4-1111-2222-3333-abcdefabcdef",
  "user": { "name": "Candidate User" },
  "tags": [{ "name": "planning" }, { "name": "ai" }]
}
```

## Database Schema Summary

- `User`: account identity, unique email, hashed password, owned notes.
- `Note`: title, content, category, archive state, public share fields, AI summary/action data, usage count, owner relation.
- `Tag`: normalized tag names connected to notes through Prisma's many-to-many relation.
