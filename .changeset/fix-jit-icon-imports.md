---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

fix(build): Dev server dynamically loads icons discovered during JIT page builds.

Icons referenced only inside page blocks (e.g., `icon: FiAperture` on a Button) were not available in the dev server's static bundle, causing a fallback icon to render. The JIT page builder now detects missing icons when a page is compiled, extracts their SVG data from react-icons, and serves it via a dynamic API endpoint. The client fetches and merges these icons at runtime without triggering a Next.js rebuild or server restart.
