# cc-docs/plans/

Planning documents for Lowdefy feature branches. Each subfolder corresponds to a development branch and contains the plan, review, research, and examples for that work.

## Convention

```
cc-docs/plans/
├── README.md                              ← this file
├── {branch-suffix}/                       ← one folder per plan branch
│   ├── README.md                          ← index of files + branch context
│   ├── REVIEW.md                          ← critical review of the plan
│   ├── REVISED_ARCHITECTURE.md            ← architecture updates (if any)
│   ├── EXAMPLE_*.md                       ← end-to-end interaction examples
│   └── takeaways/                         ← per-source-file analysis
│       └── {filename}.md
└── {another-branch-suffix}/
    └── ...
```

The branch suffix is the unique part after `claude/` — e.g., branch `claude/mcp-bridge-implementation-Tymtc` maps to folder `mcp-bridge-implementation-Tymtc/`.

The root-level `PLAN.md` at the repo root is the initial plan draft. The branch subfolder here contains the review, revisions, and supporting research.

## Current Plans

| Folder                                                              | Branch                                   | Summary                                                                  |
| ------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| [mcp-bridge-implementation-Tymtc](mcp-bridge-implementation-Tymtc/) | `claude/mcp-bridge-implementation-Tymtc` | MCP Bridge — expose Lowdefy apps to AI agents via Model Context Protocol |
