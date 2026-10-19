---
'@lowdefy/ai-utils': minor
---

feat(ai-utils): Agents bound the files the server downloads with `fileDownload`

When the model does not take a file as a link for its media type (a CSV or text file on most providers, most files on Google), the server downloads the file and sends its content. That download is now bounded: the agent property `fileDownload: { maxBytes, timeout }` caps it at 20 MB and 30 seconds by default, and a larger or slower file fails the turn. Only an `https:` link to a public address is downloaded, with the address checked after DNS resolution and on every redirect. A failed download names the file's host, never its link, so a signed link does not reach the server log.
