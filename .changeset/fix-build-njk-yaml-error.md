---
'@lowdefy/build': patch
---

fix(build): Improve error message for YAML errors in njk templates

When a .yaml.njk nunjucks template produces invalid YAML, the error now says "Nunjucks template produced invalid YAML" instead of showing a misleading line number from the generated output.
