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

import getIosTextStyle from '../../typography/getIosTextStyle.js';

// antd's code font is a CSS font stack, which a phone cannot read.
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

// Headings in the iOS text styles: h1 title1, h2 title2, h3 title3, h4 headline, h5 a semibold
// subheadline and h6 a semibold footnote in the secondary label colour.
const HEADINGS = [
  { level: 1, textStyle: 'title1' },
  { level: 2, textStyle: 'title2' },
  { level: 3, textStyle: 'title3' },
  { level: 4, textStyle: 'headline' },
  { level: 5, textStyle: 'subheadline', fontWeight: '600' },
  { level: 6, textStyle: 'footnote', fontWeight: '600', secondary: true },
];

/**
 * react-native-marked's styles in the iOS typography and the theme's semantic colours, so a
 * Markdown reads as native text in both modes: body text, headings in the iOS title styles, links
 * in the tint, code on the tertiary system fill in the platform's monospace font, quotes with a
 * bar at their start, and tables and rules in the separator colour.
 *
 * @param {Object} params
 * @param {Object} params.tokens The theme tokens for the mode showing.
 * @returns {{ listStyle: Object, styles: Object, theme: Object }} The space below a list, and
 *   react-native-marked's styles and theme colours.
 */
function getMarkdownStyles({ tokens }) {
  const text = getIosTextStyle({ textStyle: 'body', tokens });
  const paragraphSpace = 12;
  const headings = {};
  HEADINGS.forEach(({ fontWeight, level, secondary, textStyle }) => {
    const style = getIosTextStyle({
      color: secondary ? tokens.colorSecondaryLabel : undefined,
      textStyle,
      tokens,
    });
    headings[`h${level}`] = {
      ...style,
      ...(fontWeight ? { fontWeight } : {}),
      borderBottomWidth: 0,
      marginBottom: 6,
      marginTop: level <= 2 ? 20 : 14,
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
    listStyle: { marginBottom: paragraphSpace },
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
      blockquote: {
        borderLeftColor: tokens.colorOpaqueSeparator,
        borderLeftWidth: 3,
        marginBottom: paragraphSpace,
        opacity: 1,
        paddingLeft: 12,
      },
      code: {
        backgroundColor: tokens.colorTertiarySystemFill,
        borderRadius: 10,
        marginBottom: paragraphSpace,
        padding: 12,
      },
      codeText: { ...codeFont, fontSize: 14, lineHeight: 20 },
      codespan: {
        ...codeFont,
        backgroundColor: tokens.colorTertiarySystemFill,
        fontSize: 15,
      },
      em: { ...text, fontStyle: 'italic' },
      hr: {
        borderBottomColor: tokens.colorSeparator,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginVertical: 16,
      },
      li: text,
      link: { ...text, color: tokens.colorTint, fontStyle: 'normal' },
      paragraph: { marginBottom: paragraphSpace, paddingVertical: 0 },
      strikethrough: { ...text, textDecorationLine: 'line-through' },
      strong: { ...text, fontWeight: '600' },
      table: {
        borderColor: tokens.colorSeparator,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: paragraphSpace,
      },
      tableCell: { paddingHorizontal: 10, paddingVertical: 8 },
      text,
    },
  };
}

export default getMarkdownStyles;
