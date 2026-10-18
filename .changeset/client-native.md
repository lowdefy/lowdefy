---
'@lowdefy/client-native': minor
---

feat: `@lowdefy/client-native`, a React Native renderer for Lowdefy pages

A new package draws a Lowdefy page as native views over `@lowdefy/client-core` and the engine, for
a native shell to use. `<LowdefyPage />` renders one page in a scroll view: block containers by
category, visible, loading and skeletons, mount events, areas on a temporary flex layout behind
`layoutStyles`, and a `Screen` page type whose header options go to the shell's router.
`createNativeGlobals` gives the engine its platform from React Native: the route as `location`,
the window size from `Dimensions` and visibility from `AppState`.
