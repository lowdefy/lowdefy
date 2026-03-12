---
'@lowdefy/block-utils': major
'@lowdefy/blocks-antd': major
'@lowdefy/blocks-basic': major
'@lowdefy/blocks-loaders': major
'@lowdefy/blocks-aggrid': major
'@lowdefy/blocks-markdown': major
'@lowdefy/blocks-google-maps': major
'@lowdefy/blocks-echarts': major
'@lowdefy/blocks-qr': major
'@lowdefy/plugin-aws': major
'@lowdefy/layout': major
---

Migrate all blocks from `defaultProps` to `withBlockDefaults` wrapper for React 19 compatibility.

### Breaking Changes

- **`defaultProps` removed**: React 19 silently ignores `defaultProps` on function components. All ~101 block components now use a `withBlockDefaults` wrapper from `@lowdefy/block-utils` instead.
- **`withBlockDefaults` API**: New export from `@lowdefy/block-utils` that wraps block components with default property injection. Antd blocks use `withTheme` absorption; non-antd blocks use the generic wrapper.
- **Compatible with React 18 and 19**: The wrapper works on both React versions.
