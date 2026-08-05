/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { useMemo } from 'react';
import { themeAlpine, themeBalham, themeMaterial, themeQuartz } from 'ag-grid-community';
import { type } from '@lowdefy/helpers';

// Mirrors antd Table's small / middle / default densities. spacing, rowHeight and headerHeight feed
// the theme size variants; avatarSize and avatarFontSize feed the wrapper's inline CSS custom
// properties. One table serves both consumers.
const SIZES = {
  small: { spacing: 4, rowHeight: 36, headerHeight: 36, avatarSize: 20, avatarFontSize: 10 },
  middle: { spacing: 6, rowHeight: 44, headerHeight: 44, avatarSize: 24, avatarFontSize: 12 },
  large: { spacing: 8, rowHeight: 54, headerHeight: 54, avatarSize: 28, avatarFontSize: 14 },
};

// Every colour is a var(--ant-*) reference rather than a resolved value, so antd's cssVar mode
// regenerates the grid's colours on each theme or dark-mode change with no JS.
//
// Four of these tokens carry a fallback chain even though antd's cssVar mode emits its whole alias
// token set on `.lowdefy` regardless of which components a page renders — so in practice the primary
// --ant-* reference always resolves and the fallback never fires. The chains are defensive, not
// load-bearing: they guard against an antd alias no longer being emitted. That defensiveness is not
// free — tooltipBackgroundColor's and modalOverlayBackgroundColor's fallbacks land on the grid's
// normal surface colour, which would flatten the tooltip onto the grid and make the loading mask
// opaque if either ever fired. They stay because removing them is not this fix's call.
//
// Applied to all four bases: this is what the antd CSS overlay (src/ag-grid-antd.module.css) imposes
// on the six original theme blocks today, fontFamily / fontSize / oddRowBackgroundColor included; its
// --ag-* colour block is superseded by these params once that file's colours are removed.
const antdParams = {
  accentColor: 'var(--ant-color-primary)',
  backgroundColor: 'var(--ant-color-bg-container)',
  foregroundColor: 'var(--ant-color-text)',
  borderColor: 'var(--ant-color-border-secondary)',
  chromeBackgroundColor: 'var(--ant-color-fill-quaternary)',
  headerBackgroundColor: 'var(--ant-color-fill-quaternary)',
  headerTextColor: 'var(--ant-color-text)',
  headerCellHoverBackgroundColor: 'var(--ant-color-fill-tertiary)',
  oddRowBackgroundColor: 'var(--ant-color-fill-quaternary)',
  rowHoverColor: 'var(--ant-color-fill-tertiary)',
  selectedRowBackgroundColor: 'var(--ant-color-primary-bg)',
  checkboxCheckedBackgroundColor: 'var(--ant-color-primary)',
  checkboxUncheckedBorderColor: 'var(--ant-color-border)',
  fontFamily: 'var(--ant-font-family)',
  fontSize: 'var(--ant-font-size)',
  menuBackgroundColor: 'var(--ant-color-bg-elevated, var(--ant-color-bg-container))',
  menuShadow: 'var(--ant-box-shadow-secondary)',
  popupShadow: 'var(--ant-box-shadow-secondary)',
  // dropdownShadow and cellEditingShadow both ref cardShadow, whose v33 default is a hardcoded
  // light-mode literal, so leaving it unset renders wrong in dark mode.
  cardShadow: 'var(--ant-box-shadow-secondary)',
  tooltipBackgroundColor: 'var(--ant-color-bg-spotlight, var(--ant-color-bg-container))',
  // AG Grid's default tooltipTextColor refs textColor, which foregroundColor above sets to antd's
  // normal (non-inverted) text colour — unreadable against the spotlight surface tooltipBackgroundColor
  // uses. antd always pairs colorBgSpotlight with colorTextLightSolid, a token that is #fff in both
  // light and dark mode, so the fallback here is a literal #fff rather than another --ant-* alias:
  // aliasing to e.g. --ant-color-text would just reintroduce this same inversion.
  tooltipTextColor: 'var(--ant-color-text-light-solid, #fff)',
  modalOverlayBackgroundColor: 'var(--ant-color-bg-mask, var(--ant-color-bg-container))',
  // Not a colour. AG Grid's own dark value lives under a data-ag-theme-mode="dark" attribute Lowdefy
  // never sets, and this param has no antd token to ride on, so the decision is handed to the
  // document and set as color-scheme on <html> from the app's dark-mode state.
  browserColorScheme: 'inherit',
};

// Lowdefy blocks only — the four structural choices the antd overlay never made. Applying these to a
// legacy base would overwrite the params that base sets to define itself (Balham's borderRadius: 2 and
// headerFontWeight: 'bold', Material's borderRadius: 0) and, because a param set in the default mode
// is deleted from every non-default mode, erase that base's light/dark variants for those names too.
const lowdefyParams = {
  headerFontWeight: 600,
  borderRadius: 'var(--ant-border-radius)',
  wrapperBorderRadius: 'var(--ant-border-radius-lg, var(--ant-border-radius, 8px))',
  oddRowBackgroundColor: 'transparent', // no zebra — antd Table's default
};

const base = themeQuartz.withParams({ ...antdParams, ...lowdefyParams });

// Sizes differ only in spacing and heights, matching antd, where size changes padding rather than
// the type scale. Built once at module scope so switching size only swaps which object is passed.
const themes = Object.fromEntries(
  Object.entries(SIZES).map(([size, { spacing, rowHeight, headerHeight }]) => [
    size,
    base.withParams({ spacing, rowHeight, headerHeight }),
  ])
);

// Bounded by the number of distinct bad values in the app's config, not by render count.
const warned = new Set();

// Object.hasOwn rather than `in`: `in` walks the prototype chain, so size: 'toString' would resolve
// themes['toString'] to a function and AG Grid would be handed a function as its theme.
//
// size is normalised to a string before the hasOwn check, the warned Set and the message: a
// non-primitive size (e.g. an object or array from a config mistake) is a fresh reference every
// render, so keying on the raw value would warn once per render instead of once per distinct value.
const resolveSize = (size) => {
  if (type.isNone(size)) return 'middle';
  const key = String(size);
  if (Object.hasOwn(SIZES, key)) return key;
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(
      `Lowdefy AG Grid property "size" received "${key}", which is not a valid size. Use one of ${Object.keys(
        SIZES
      ).join(', ')}. Falling back to "middle".`
    );
  }
  return 'middle';
};

const themeForSize = (size) => themes[resolveSize(size)];

const sizeConfig = (size) => SIZES[resolveSize(size)];

// The six original blocks take antdParams and only antdParams, on AG Grid's prebuilt reproductions of
// their file themes. Their type scale, radii, header weight and zebra come from the base theme, which
// is what keeps them recognisably Balham / Alpine / Material.
const themeBalhamAntd = themeBalham.withParams(antdParams);
const themeAlpineAntd = themeAlpine.withParams(antdParams);
// Material's styleMaterial part sets its own primaryColor and refs it for the tab underline, button
// text, input focus border and cell editing border. antdParams sets accentColor, a different param,
// so without this those stay Material indigo. primaryColor exists only on Material's param type, so
// the shared map cannot carry it.
const themeMaterialAntd = themeMaterial.withParams({
  ...antdParams,
  primaryColor: 'var(--ant-color-primary)',
});

// Returns the base object untouched when there is nothing to merge, so the module-scope themes stay
// shared and identity-stable. An empty object counts as absent: {} is what an operator-driven
// themeParams produces when nothing applies. type.isObject rejects anything that is not a plain
// object (a string, array, number or boolean from a config mistake) instead of letting
// Object.keys coerce it — Object.keys('dark') is truthy and would make withParams emit junk
// --ag-0 / --ag-1 style variables from the string's characters. Keyed on the serialised params
// rather than object identity because Lowdefy re-evaluates block properties each render, so
// themeParams is a fresh reference every time.
const useGridTheme = (baseTheme, themeParams) => {
  const key =
    type.isObject(themeParams) && Object.keys(themeParams).length
      ? JSON.stringify(themeParams)
      : null;
  return useMemo(() => (key ? baseTheme.withParams(JSON.parse(key)) : baseTheme), [baseTheme, key]);
};

export {
  SIZES,
  sizeConfig,
  themeAlpineAntd,
  themeBalhamAntd,
  themeForSize,
  themeMaterialAntd,
  useGridTheme,
};
