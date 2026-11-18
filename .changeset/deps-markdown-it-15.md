---
'@lowdefy/email-templates': patch
---

fix(deps): Update markdown-it to 15.0.3

markdown-it 15 fixes several inputs that took quadratic time to parse (multiline reference definitions, unclosed HTML comments, mismatched smart quotes), and follows CommonMark more closely for code spans made only of spaces and backslashes in link destinations. Email templates use it with linkify and raw HTML off, so its breaking changes (linkify-it 6, removed internal subpath exports) do not affect them, and emails render the same.
