---
'lowdefy': patch
---

fix(cli): Journey variants keep the journey's `stubs` and case table

`lowdefy journeys variants` dropped a journey's `stubs`, so a variant of a stubbed journey made its outside calls for real and lost its forced failures. A variant of a journey with a `cases` table kept its `_case` placeholders but dropped the table, so it was refused. Variants now keep both, and a case-table variant replays once per row. A case-table journey with an unknown top-level key is now refused naming the journey, not its first row.
