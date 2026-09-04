# _menu

```
(menuId: string): object
(menuIndex: number): object
(all: boolean): object[]
(arguments: {
  value?: string,
  index?: number
  all?: boolean,
}): object | object[]
```

The `_menu` operator can be used to access `menu` objects defined in the [`menus`](/lowdefy-schema) section of the Lowdefy configuration.

#### Arguments

###### string
The `menuId` of the `menu` to return.

###### number
The index of the `menu` to return.

###### boolean
If the `_menu` operator is called with boolean argument `true`, the entire `menus` object is returned.

###### object
  - `value: string`: The `menuId` of the `menu` to return.
  - `index: number`: The index of the `menu` to return.
  - `all: boolean`: If the `_menu` operator is called with boolean argument `true`, the entire `menus` object is returned.

#### Examples

###### Get the `menus` object:
```yaml
_menu: true
```
```yaml
_menu:
  all: true
```
Returns: An array of `menu` objects.

###### Get a `menu` by `id`:
```yaml
_menu: default
```
```yaml
_menu:
  value: default
```
Returns: A `menu` object.

###### Get a `menu` by `index`:
```yaml
_menu: 0
```
```yaml
_menu:
  index: 0
```
Returns: A `menu` object.
