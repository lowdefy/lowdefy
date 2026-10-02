---
'@lowdefy/server-dev': minor
---

feat(server-dev): Dev server browser tools use the Playwright headless shell and close the browser when idle

Screenshots, journeys, headless state inspection, operator evaluation and state loads now launch Playwright's `chromium-headless-shell` instead of system Google Chrome. Measured with the same Playwright version, one open page takes about 79 MB instead of 391 MB, an idle browser 29 MB instead of 99 MB, and a launch takes under a second instead of 1.5 to 7 seconds.

- When the shell is missing, the dev server downloads it itself the first time a browser tool needs it (about 100 MB, once per machine and Playwright version), in a separate short-lived process. Meanwhile the call uses system Chrome if it is installed; with neither, it waits for the download. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to turn the download off, or install it yourself with `npx playwright install chromium-headless-shell`.
- The browser closes after 90 seconds with no open page and no browser tool call, and relaunches on the next call, so a dev server that runs for hours no longer holds a browser it used once.
- The dev server tags every browser it launches and kills it when the server process that launched it exits for any reason. A server killed outright no longer leaves a system Chrome running.
- The server no longer loads Playwright at start-up, which shortens every server start and restart by about half a second.
