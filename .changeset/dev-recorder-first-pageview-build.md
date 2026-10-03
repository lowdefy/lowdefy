---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

The dev recorder now stamps a pageview with the build of the page config the page renders. On a tab's first load the pageview used to go out with no build, so the server stamped whichever build was current when the batch arrived. After a client navigation it carried the previous page's build. The recorder now holds the pageview until the page has rendered its config, and a page left before it rendered still records with no build.
