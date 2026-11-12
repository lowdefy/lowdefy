---
'@lowdefy/build': major
'@lowdefy/client': major
'@lowdefy/layout': major
'@lowdefy/server': major
'@lowdefy/server-dev': major
'@lowdefy/server-e2e': major
'@lowdefy/block-utils': major
'@lowdefy/email-templates': major
'@lowdefy/blocks-aggrid': major
'@lowdefy/blocks-antd': major
'@lowdefy/blocks-antd-x': major
'@lowdefy/blocks-basic': major
'@lowdefy/blocks-captcha': major
'@lowdefy/blocks-diff': major
'@lowdefy/blocks-echarts': major
'@lowdefy/blocks-files': major
'@lowdefy/blocks-google-maps': major
'@lowdefy/blocks-loaders': major
'@lowdefy/blocks-markdown': major
'@lowdefy/blocks-qr': major
'@lowdefy/blocks-table': major
'@lowdefy/blocks-tiptap': major
'@lowdefy/plugin-aws': major
---

feat(deps)!: Update React to 19

Lowdefy apps now run on React 19.3.1 (was 18.2.0). `@lowdefy/server` and `@lowdefy/server-dev` give every app its React, and every block plugin in the app, custom and local plugins included, renders with that same copy. So custom blocks now run on React 19, whatever React version the plugin itself declares.

The Lowdefy block plugins declare `react: ^19` and `react-dom: ^19` as peer dependencies, in place of `>=18`. They no longer support React 18. `@lowdefy/blocks-antd-x` declares `antd: ^6` in place of an exact antd version.

**What breaks in custom blocks.** React 19 removed some long-deprecated APIs. Check your custom block plugins for:

- **`defaultProps` on function components is silently ignored.** Nothing crashes, but the props lose their defaults, so a block can render with `undefined` where it used to get a default. Move the defaults into the props destructuring: `function MyBlock({ size = 'medium' })`. Class components still support `defaultProps`.
- **`propTypes` is ignored.** Checks no longer run; remove them.
- **`ReactDOM.render`, `ReactDOM.hydrate` and `unmountComponentAtNode` are removed.** Use `createRoot` from `react-dom/client` and `root.unmount()`.
- **`ReactDOM.findDOMNode` is removed.** Use a ref on the DOM element.
- **String refs (`ref="input"`) are removed.** Use `useRef` or a callback ref.
- **Legacy context (`contextTypes`, `childContextTypes`, `getChildContext`) is removed.** Use `React.createContext`.
- **`react-dom/test-utils` is removed.** Import `act` from `react`.
- **Third-party libraries that only support React 18** may fail to render or log errors. Update them to a release that supports React 19.

`forwardRef` still works but is deprecated: function components now receive `ref` as a normal prop, and Lowdefy's own blocks no longer use `forwardRef`. Declare `react: ^19` and `react-dom: ^19` as peer dependencies of your block plugin, not as dependencies.
