---
'@lowdefy/e2e-utils': patch
---

fix(e2e-utils): `goto`, `waitForPage` and `waitForReady` wait for the page's onInit to finish

They returned as soon as the page's context existed. The engine creates it when the page first renders, before onInit runs, so a test that read state straight after `goto` (`getState`, `getBlockState`) could see the page without what onInit sets. They now wait until onInit has finished, which is also when the page first shows its blocks. onInitAsync is not waited for. The page manager's `goto` and `waitForPage`, and `setUrlQuery`, which use the same wait, get the same fix.
