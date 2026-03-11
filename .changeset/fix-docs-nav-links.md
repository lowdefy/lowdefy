---
'@lowdefy/docs': patch
---

fix(docs): Fix broken nav links and build warnings

- Fix broken page links: tutorial pages were renamed/split but nav refs not updated
- Remove OracleDB page: page was already commented out, only a stale link from Knex remained
- Add granular `~ignoreBuildChecks` for false-positive warnings: state-refs on Descriptions, request-refs on AgGrid, types on Comment
