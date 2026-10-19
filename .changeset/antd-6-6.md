---
'@lowdefy/blocks-antd-x': minor
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
---

chore: Update antd to 6.6.5 and Ant Design X to 2.9.0.

antd moves from 6.3.1 to 6.6.5, `@ant-design/x` and `@ant-design/x-markdown` from 2.7.0 to 2.9.0,
and `@ant-design/icons` from 6.1.0 to 6.3.4. Custom block plugins that import from `antd`
directly should pin `antd@6.6.5` so the app keeps a single copy of antd.
