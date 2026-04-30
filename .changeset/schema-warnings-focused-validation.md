---
'@lowdefy/build': patch
---

fix(build): Replace schema validation errors with warnings and add focused validations.

AJV schema validation now emits warnings instead of blocking the build. Focused validations in each build step (validateBlock, buildConnections, buildEvents, etc.) provide better error messages with full context — page, block, and event names — instead of generic schema messages. Added focused validation for connections and menu items that previously relied on schema checks alone.
