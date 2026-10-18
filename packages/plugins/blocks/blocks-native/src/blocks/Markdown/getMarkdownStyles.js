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

import { Platform, StyleSheet } from 'react-native';
import { withAlpha } from '@lowdefy/client-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';

// antd's code font is a CSS font stack, which a phone cannot read.
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

// Headings in the iOS text styles, with more space above than below so each one belongs to the
// text it heads: h1 title1, h2 title2, h3 title3, h4 headline, h5 a semibold subheadline and h6
// a semibold footnote in the secondary label colour.
const HEADINGS = [
  { level: 1, textStyle: 'title1', marginTop: 28, marginBottom: 10 },
  { level: 2, textStyle: 'title2', marginTop: 24, marginBottom: 8 },
  { level: 3, textStyle: 'title3', marginTop: 20, marginBottom: 6 },
  { level: 4, textStyle: 'headline', marginTop: 18, marginBottom: 4 },
  { level: 5, textStyle: 'subheadline', fontWeight: '600', marginTop: 16, marginBottom: 4 },
  {
    level: 6,
    textStyle: 'footnote',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    secondary: true,
  },
];

/**
 * How a Markdown draws, in the iOS typography and the theme's semantic colours, so it reads as
 * native text in both modes: react-native-marked's text styles (body text, headings in the iOS
 * title styles, links in the tint, inline code on the tertiary system fill in the platform's
 * monospace font), and the palette the block's own lists, task boxes, code cards, quotes,
 * tables and link chips draw with.
 *
 * @param {Object} params
 * @param {boolean} params.isDark
 * @param {Object} params.tokens The theme tokens for the mode showing.
 * @param {number} [params.blockSpace] The space below a paragraph, list, quote, code block or
 *   table. 12 by default.
 * @returns {{ palette: Object, styles: Object, theme: Object }} The block's palette, and
 *   react-native-marked's styles and theme colours.
 */
function getMarkdownStyles({ blockSpace = 12, isDark, tokens }) {
  const text = getIosTextStyle({ textStyle: 'body', tokens });
  const headings = {};
  HEADINGS.forEach(({ fontWeight, level, marginBottom, marginTop, secondary, textStyle }) => {
    const style = getIosTextStyle({
      color: secondary ? tokens.colorSecondaryLabel : undefined,
      textStyle,
      tokens,
    });
    headings[`h${level}`] = {
      ...style,
      ...(fontWeight ? { fontWeight } : {}),
      borderBottomWidth: 0,
      marginBottom,
      marginTop,
      marginVertical: undefined,
      paddingBottom: 0,
    };
  });
  const codeFont = {
    color: tokens.colorLabel,
    fontFamily: monospace,
    fontStyle: 'normal',
    fontWeight: 'normal',
  };
  return {
    palette: {
      blockSpace,
      codeBackground: tokens.colorTertiarySystemFill,
      isDark,
      label: tokens.colorLabel,
      quoteBackground: withAlpha({ alpha: isDark ? 0.12 : 0.06, color: tokens.colorTint }),
      secondaryLabel: tokens.colorSecondaryLabel,
      separator: tokens.colorSeparator,
      tableHeader: tokens.colorQuaternarySystemFill,
      tertiaryLabel: tokens.colorTertiaryLabel,
      text,
      tint: tokens.colorTint,
      tokens,
    },
    theme: {
      colors: {
        border: tokens.colorSeparator,
        code: tokens.colorTertiarySystemFill,
        link: tokens.colorTint,
        text: tokens.colorLabel,
      },
    },
    styles: {
      ...headings,
      // react-native-marked's own quote bar, code padding and table border are left off: the
      // renderer draws its own.
      blockquote: { borderLeftWidth: 0, marginBottom: blockSpace, opacity: 1, paddingLeft: 0 },
      code: {
        backgroundColor: tokens.colorTertiarySystemFill,
        marginBottom: blockSpace,
        minWidth: 0,
        padding: 0,
      },
      codeText: { ...codeFont, fontSize: 14, lineHeight: 20 },
      codespan: {
        ...codeFont,
        backgroundColor: tokens.colorTertiarySystemFill,
        fontSize: 15,
      },
      em: { ...text, fontStyle: 'italic' },
      hr: {
        backgroundColor: tokens.colorSeparator,
        borderBottomWidth: 0,
        height: StyleSheet.hairlineWidth,
        marginVertical: 20,
      },
      image: { borderRadius: 10 },
      li: text,
      link: { ...text, color: tokens.colorTint, fontStyle: 'normal' },
      list: { marginBottom: blockSpace },
      paragraph: { marginBottom: blockSpace, paddingVertical: 0 },
      strikethrough: {
        ...text,
        color: tokens.colorSecondaryLabel,
        textDecorationLine: 'line-through',
      },
      strong: { ...text, fontWeight: '600' },
      table: { borderWidth: 0, marginBottom: blockSpace },
      text,
    },
  };
}

export default getMarkdownStyles;
