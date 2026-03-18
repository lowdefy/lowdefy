---
'@lowdefy/server-dev': minor
'@lowdefy/client': minor
---

Add ErrorBar component to the development server that displays build errors and warnings in a fixed bottom bar. JIT build warnings now propagate from the build pipeline to the browser for immediate developer feedback.

The ErrorBar includes a copy-to-clipboard button that copies all error and warning details (including stack traces) for easy sharing and debugging. Stack traces are now preserved through the full pipeline: build warnings, build errors, and runtime errors all propagate their stack to the browser.
