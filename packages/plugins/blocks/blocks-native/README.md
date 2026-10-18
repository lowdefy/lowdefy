# Lowdefy Native Blocks

Lowdefy blocks for the native runtime, the React Native renderer a Lowdefy mobile shell uses.

The package exports `./types` and `./metas`, which the Lowdefy build reads to resolve the block types of mobile pages, and `./blocks`, the block components a shell renders pages with. A native block keeps the name, properties, events, methods and value type of the web block it stands for, so a page can be shared between web and phone.

| Block          | Built on                                       |
| -------------- | ---------------------------------------------- |
| `Button`       | React Native `Pressable`                       |
| `DateSelector` | `@expo/ui` community `DateTimePicker`          |
| `List`         | `FlatList`, or `SectionList` with `sectionKey` |
| `ListItem`     | React Native views                             |
| `NumberInput`  | React Native `TextInput`                       |
| `Selector`     | `@expo/ui` `Picker`                            |
| `Switch`       | `@expo/ui` `Switch`                            |
| `TextArea`     | React Native `TextInput`                       |
| `TextInput`    | React Native `TextInput`                       |

`@expo/ui` and `react-native` are peer dependencies: the shell carries them.
