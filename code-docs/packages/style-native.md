# @lowdefy/style-native

Converts a Lowdefy style object (one style slot) to a React Native style object. The build uses it on literal styles of mobile pages, and the mobile shell uses it on styles it gets unconverted, so both convert the same way.

```js
import { convertStyle } from '@lowdefy/style-native';

convertStyle({ padding: '8px 24px', fontSize: '1rem', display: 'grid' });
// {
//   style: { paddingTop: 8, paddingRight: 24, paddingBottom: 8, paddingLeft: 24, fontSize: 16 },
//   errors: [{ key: 'display', message: '"display: grid" is web-only: ...' }],
// }
```

- **Values.** `px` becomes a number, `rem` a number at 16 px, unitless numeric strings numbers, `fontWeight` a string. `%`, colours and keywords stay as they are. Other units (`em`, `vh`, `vw`, ...) are errors.
- **Shorthands.** `padding`, `margin`, `gap`, `border`, `borderTop`/`Right`/`Bottom`/`Left`, `borderRadius` and `flex` expand into their parts when they have several values.
- **Errors.** Selectors and media queries, `grid*`, `transition*`, `animation*`, `cursor`, `display` other than `flex`/`none`/`contents`, `position: fixed`/`sticky`, CSS functions (`calc`, `var`, `min`, `max`, `clamp`, `env`), `!important` and unitless `lineHeight`. The build fails on them; the shell reports them. `getUnsupportedStyleMessage({ key, value })` is the key check alone, which the build also applies to compiled Tailwind classes.
- Keys starting with `~` (build markers) and object values (`shadowOffset`, `transform` arrays) pass through.

**Which styles the shell converts.** The build converts literal slots of mobile-only pages in place. The shell converts the evaluated slot when the page is shared (`target: both`, whose JSON the web also reads) or when the raw slot is, or holds, an operator. A converted slot is never converted twice.

It has no dependencies, so the shell can bundle it.
