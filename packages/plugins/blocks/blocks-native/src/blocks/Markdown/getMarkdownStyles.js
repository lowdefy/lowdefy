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

import { Platform } from 'react-native';

// antd's code font is a CSS font stack, which a phone cannot read.
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

function getHeadingStyle({ fontSize, lineHeight, tokens }) {
  return {
    color: tokens.colorTextHeading,
    fontSize,
    fontWeight: String(tokens.fontWeightStrong),
    lineHeight: fontSize * lineHeight,
    marginBottom: fontSize * 0.5,
    marginTop: fontSize * 0.6,
    paddingBottom: 0,
    borderBottomWidth: 0,
  };
}

/**
 * react-native-marked's styles from the app's computed antd tokens: body text as a Paragraph,
 * headings 1 to 5 as a Title of that level (6 at body size), code in the platform's monospace
 * font on the fill colour antd's Typography code uses.
 *
 * @param {Object} params
 * @param {Object} params.tokens The computed antd tokens for the mode showing.
 * @returns {{ listStyle: Object, styles: Object, theme: Object }} The space below a list, and
 *   react-native-marked's styles and theme colours.
 */
function getMarkdownStyles({ tokens }) {
  const lineHeight = tokens.fontSize * tokens.lineHeight;
  const text = { color: tokens.colorText, fontSize: tokens.fontSize, lineHeight };
  const headings = {};
  [1, 2, 3, 4, 5].forEach((level) => {
    headings[`h${level}`] = getHeadingStyle({
      fontSize: tokens[`fontSizeHeading${level}`],
      lineHeight: tokens[`lineHeightHeading${level}`],
      tokens,
    });
  });
  headings.h6 = getHeadingStyle({
    fontSize: tokens.fontSize,
    lineHeight: tokens.lineHeight,
    tokens,
  });
  const codeFont = {
    color: tokens.colorText,
    fontFamily: monospace,
    fontSize: tokens.fontSize * 0.85,
    fontStyle: 'normal',
    fontWeight: 'normal',
  };
  return {
    listStyle: { marginBottom: tokens.fontSize },
    theme: {
      colors: {
        border: tokens.colorBorderSecondary,
        code: tokens.colorFillTertiary,
        link: tokens.colorLink,
        text: tokens.colorText,
      },
    },
    styles: {
      ...headings,
      blockquote: {
        borderLeftColor: tokens.colorBorder,
        borderLeftWidth: 4,
        marginBottom: tokens.fontSize,
        opacity: 1,
        paddingLeft: tokens.paddingSM,
      },
      code: {
        backgroundColor: tokens.colorFillTertiary,
        borderRadius: tokens.borderRadius,
        marginBottom: tokens.fontSize,
        padding: tokens.paddingSM,
      },
      codeText: { ...codeFont, lineHeight },
      codespan: { ...codeFont, backgroundColor: tokens.colorFillTertiary },
      em: { ...text, fontStyle: 'italic' },
      hr: { borderBottomColor: tokens.colorSplit, marginVertical: tokens.margin },
      li: text,
      link: { ...text, color: tokens.colorLink, fontStyle: 'normal' },
      paragraph: { marginBottom: tokens.fontSize, paddingVertical: 0 },
      strikethrough: { ...text, textDecorationLine: 'line-through' },
      strong: { ...text, fontWeight: String(tokens.fontWeightStrong) },
      table: { borderColor: tokens.colorBorderSecondary, marginBottom: tokens.fontSize },
      tableCell: { paddingHorizontal: tokens.paddingSM, paddingVertical: tokens.paddingXS },
      text,
    },
  };
}

export default getMarkdownStyles;
