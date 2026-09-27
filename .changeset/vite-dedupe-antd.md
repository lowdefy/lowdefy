---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(server): The client build shares one copy of `antd`, `@ant-design/x`, `@ant-design/cssinjs` and `dayjs` with linked plugin packages (pnpm `link:` or workspace plugins), as it already did for React. A linked block package resolved its own `antd`, so its components never saw the server's `App`, `ConfigProvider` and `StyleProvider`. For example, action messages failed with `message.error is not a function`. A linked `dayjs` also missed the locale the client sets.
