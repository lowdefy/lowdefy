---
'@lowdefy/api': patch
'@lowdefy/server': patch
---

fix(api, server): The production log no longer records evaluated values

The production server's error log and Sentry no longer carry an error's `received` value. It holds an operator's or control's evaluated input, such as a user's ID number or a token fetched by an earlier step, which the secret scrub cannot recognise. The log still names the error's class, message, config location and step. The dev server's log keeps `received`.

The page request debug line (`debug_request`) logs the block, page and request ids, not the request payload.
