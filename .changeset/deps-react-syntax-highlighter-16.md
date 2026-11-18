---
'@lowdefy/blocks-markdown': patch
---

fix(deps): Update react-syntax-highlighter to 16.1.2

react-syntax-highlighter 16 moves its Prism builds to refractor 5, which fixes security issues in the older refractor and Prism versions. MarkdownWithCode uses the highlight.js build, which is unchanged (highlight.js 10, same styles), so code blocks highlight exactly as before.
