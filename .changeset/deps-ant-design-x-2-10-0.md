---
'@lowdefy/blocks-antd-x': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(deps): Update @ant-design/x and @ant-design/x-markdown to 2.10.0

The AgentChat and AgentConversations blocks get keyboard access to clickable prompts (Tab to focus, Enter or Space to choose) and less re-highlighting of unchanged code blocks while a reply streams. With `renderLatex` on, amounts such as `$5 and $10` in a message no longer render as a formula: single-dollar math now follows Pandoc's rules, so `$x$` still renders and `$ x $` does not. Markdown rendering moves to marked 16.
