# Lowdefy Native Blocks

Lowdefy blocks for the native runtime, the React Native renderer a Lowdefy mobile shell uses.

Each native block takes its web block's type name, properties, events, methods and slots, so a page can be shared by web and mobile. The package exports:

- `./blocks`: the React Native block components, rendered by `@lowdefy/client-native`.
- `./metas` and `./types`: what the Lowdefy build reads to resolve and check the block types of mobile pages.

Blocks draw with `StyleSheet` styles and the app's computed antd theme tokens (`useTheme` from `@lowdefy/client-native`); icons draw through `components.Icon`, the native icon renderer `@lowdefy/client-native` installs. Inputs draw their controls from `@expo/ui`; `@expo/ui`, `react-native` and `react-native-svg` are peer dependencies the shell carries.
