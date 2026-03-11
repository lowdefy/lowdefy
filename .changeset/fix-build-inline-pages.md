---
'@lowdefy/build': patch
---

fix(build): Preserve inline page content in JIT builds

Pages declared inline in `lowdefy.yaml` (not via `_ref`) had their content stripped during shallow builds with no way to recover at JIT time, resulting in empty page shells. Detect inline pages by checking refId matches root ref with no sourceRef, and skip stripping. Set refId to null for inline pages in `createPageRegistry` so `buildPageJit` reads the pre-built artifact instead of attempting JIT resolution.
