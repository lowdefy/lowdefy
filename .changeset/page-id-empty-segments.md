---
'@lowdefy/build': patch
---

fix(build): Page ids with empty segments are refused

A page id such as `foo/`, `/foo` or `a//b` passed the build but could not be matched to a URL pattern, which made page requests fail. The build now rejects it with an error naming the id.
