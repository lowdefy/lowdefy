---
'@lowdefy/docs-content': patch
'@lowdefy/blocks-antd': patch
---

test: docs fences validate against the plugin schemas; block properties must be declared and consumed

Every yaml fence in the agent documentation is validated against the schema it claims (block, operator, request, connection or app config) with the schemas read live from the installed plugin packages, so renaming a property in a plugin fails the docs that still show the old name (6,345 block nodes, 1,302 operator nodes, 210 request nodes and 57 connection nodes across 3,176 fences). A second scan holds every block in `blocks-antd` and `blocks-basic` to the inverse of the build's property check: a property a block schema declares that the component never reads, and a property the component reads that no schema declares, are both errors. Both scans record the mismatches that exist today with the reason each one is wrong, so they cannot grow quietly and cannot rot.
