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

import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { useMarkdown } from 'react-native-marked';

import getMarkdownStyles from '../Markdown/getMarkdownStyles.js';
import MarkdownTokenizer from '../Markdown/MarkdownTokenizer.js';
import TimelineMarkdownRenderer from './TimelineMarkdownRenderer.js';
import toTimelineMarkdown from './toTimelineMarkdown.js';

const BODY_SIZE = 15;
const BODY_LINE = 21;
const PARAGRAPH_GAP = 8;
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

// The Markdown block's styles at the comment body size, in the label colours, with paragraphs
// spaced for a card rather than a page.
function getBodyStyles({ colors, isDark, tokens }) {
  const { palette, styles, theme } = getMarkdownStyles({
    blockSpace: PARAGRAPH_GAP,
    isDark,
    tokens: {
      ...tokens,
      colorText: colors.label,
      colorTextHeading: colors.label,
      fontSize: BODY_SIZE,
      fontSizeHeading1: 20,
      fontSizeHeading2: 18,
      fontSizeHeading3: 17,
      fontSizeHeading4: 16,
      fontSizeHeading5: 15,
      lineHeight: BODY_LINE / BODY_SIZE,
      lineHeightHeading1: 1.3,
      lineHeightHeading2: 1.3,
      lineHeightHeading3: 1.3,
      lineHeightHeading4: 1.3,
      lineHeightHeading5: 1.3,
    },
  });
  return {
    palette: {
      ...palette,
      codeBackground: colors.fill,
      label: colors.label,
      separator: colors.separator,
      tint: colors.tint,
    },
    theme: { ...theme, colors: { ...theme.colors, link: colors.tint, text: colors.label } },
    styles: {
      ...styles,
      paragraph: { ...styles.paragraph, marginBottom: PARAGRAPH_GAP },
      code: { ...styles.code, backgroundColor: colors.fill, marginBottom: PARAGRAPH_GAP },
      codespan: { ...styles.codespan, backgroundColor: colors.fill },
      blockquote: { ...styles.blockquote, marginBottom: PARAGRAPH_GAP },
      link: { ...styles.link, color: colors.tint },
    },
  };
}

/**
 * A comment's markdown, drawn with the Markdown block's renderer: mentions as @Name chips and
 * `[[KEY]]` record links in the tint. The space under the last paragraph is taken back, so the
 * card's padding holds.
 */
function CommentBody({
  body,
  colors,
  isDark,
  mentions,
  onLinkPress,
  onRecordPress,
  pattern,
  people,
  tokens,
}) {
  const { palette, styles, theme } = useMemo(
    () => getBodyStyles({ colors, isDark, tokens }),
    [colors, isDark, tokens]
  );
  const tokenizer = useMemo(() => new MarkdownTokenizer(), []);
  const renderer = useMemo(
    () =>
      new TimelineMarkdownRenderer({
        chipStyles: {
          mention: { backgroundColor: colors.tintFill, color: colors.tint, fontWeight: '600' },
          muted: { backgroundColor: colors.fill, color: colors.secondary, fontWeight: '600' },
          record: { color: colors.tint, fontFamily: monospace, fontSize: BODY_SIZE - 1 },
        },
        onLinkPress,
        onRecordPress,
        palette,
        skipHtml: false,
      }),
    [colors, onLinkPress, onRecordPress, palette]
  );
  const markdown = useMemo(
    () => toTimelineMarkdown({ body, mentions, people, pattern }),
    [body, mentions, people, pattern]
  );
  const elements = useMarkdown(markdown, {
    colorScheme: isDark ? 'dark' : 'light',
    renderer,
    styles,
    theme,
    tokenizer,
  });
  return <View style={{ marginBottom: -PARAGRAPH_GAP }}>{elements}</View>;
}

export default CommentBody;
