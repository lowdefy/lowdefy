# Lowdefy Native Blocks

Lowdefy blocks for the native runtime, the React Native renderer a Lowdefy mobile shell uses.

Each native block takes its web block's type name, properties, events, methods and slots, so a page can be shared by web and mobile. The package exports:

- `./blocks`: the React Native block components, rendered by `@lowdefy/client-native`.
- `./metas` and `./types`: what the Lowdefy build reads to resolve and check the block types of mobile pages.
- `./icon/createIcon.js`: the native icon renderer, which a renderer installs as `components.Icon`.

Blocks draw with `StyleSheet` styles and the app's computed antd theme tokens (`useTheme` from `@lowdefy/client-native`); icons draw with `react-native-svg`.
