---
'@lowdefy/ai-utils': minor
---

feat(ai-utils): GenerateText and GenerateObject bound the files the server downloads with `fileDownload`

A file in a `GenerateText` or `GenerateObject` request's `messages` that the model does not take as a link (a CSV or text file on most providers, most files on Google) is downloaded by the server within the same limits agents have: the request property `fileDownload: { maxBytes, timeout }` caps it at 20 MB and 30 seconds by default, only an `https:` link to a public address is downloaded, with the address checked on every redirect, and a failed download names the file's host, never its link. Download errors no longer start with "Agent", since requests share them.
