# Lowdefy react-icons Icon Set

`@lowdefy/icons-react-icons` is an icon-set plugin with every [react-icons](https://react-icons.github.io/react-icons/) 5.6.0 icon under its react-icons name (`AiOutlineUser`, `MdLocationOn`, `FaWhatsapp`, …).

Lowdefy v7 uses [Lucide](https://lucide.dev) icons. This set is a migration aid for apps that cannot rewrite every icon name, for example apps that store icon names in a database or use brand logos that Lucide does not have. New apps should use semantic names (`edit`, `delete`) and Lucide names (`Pencil`) instead. The `lowdefy upgrade` codemod rewrites react-icons names in config.

## Usage

Add the plugin, and make `react-icons` the app's default icon set so old names resolve unqualified:

```yaml
plugins:
  - name: '@lowdefy/icons-react-icons'
    version: 7.0.0

theme:
  icons:
    set: react-icons
```

- Names resolve unqualified (`AiOutlineUser`) when `theme.icons.set` is `react-icons`, or qualified (`react-icons:AiOutlineUser`) with any default set.
- Lucide names and semantic names keep working. The set has no semantic map, so block default icons and Ant Design component icons stay Lucide.
- A build bundles only the icons the app uses, and reads only the react-icons packs those names come from.
- Names shared by two packs resolve to the pack Lowdefy used before v7: `fa` before `fa6`, `hi` before `hi2`, and `io5` before `io`.
- Stroke width is an app setting (`theme.icons.strokeWidth`), so outline packs drawn with a different stroke width render at the app's stroke width.
