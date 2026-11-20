---
'lowdefy': patch
---

fix(cli): Journey variants keep the journey's `stubs` and case table

`lowdefy journeys variants` dropped a journey's `stubs`, so a variant of a stubbed journey made its outside calls for real and lost its forced failures. A variant of a journey with a `cases` table kept its `_case` placeholders but dropped the table, so it was refused. Variants now keep both, and a case-table variant replays once per row. The `role`, `tenant`, `empty` and `volume` kinds read each row's user, so a case table gets role variants for the role sets its rows lack, tenant variants for each row and empty and volume variants for its rows' users, each keeping the rows it was made for. A case-table journey with an unknown top-level key is now refused naming the journey, not its first row.
