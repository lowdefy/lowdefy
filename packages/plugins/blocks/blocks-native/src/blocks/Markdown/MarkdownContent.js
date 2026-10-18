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
import { View } from 'react-native';
import { useMarkdown } from 'react-native-marked';

import getMarkdownStyles from './getMarkdownStyles.js';
import MarkdownRenderer from './MarkdownRenderer.js';
import MarkdownTokenizer from './MarkdownTokenizer.js';
import useComponentTokens from '../../useComponentTokens.js';

/**
 * GitHub-flavoured markdown drawn with React Native views in the iOS typography and the theme's
 * semantic colours: the Markdown block's renderer, which AgentChat draws its answers with too.
 * useMarkdown gives the elements rather than react-native-marked's FlatList, since the markdown
 * sits in the page's scroll view.
 *
 * @param {Object} props
 * @param {string} props.content
 * @param {(href: string) => void} props.onLinkPress
 * @param {boolean} [props.skipHtml] Leave raw html out rather than drawing its source.
 * @param {Object} [props.style]
 */
function MarkdownContent({ content, onLinkPress, skipHtml = false, style }) {
  const { isDark, tokens } = useComponentTokens();
  const {
    listStyle,
    styles: markdownStyles,
    theme,
  } = useMemo(() => getMarkdownStyles({ tokens }), [tokens]);
  const tokenizer = useMemo(() => new MarkdownTokenizer(), []);
  const renderer = useMemo(
    () => new MarkdownRenderer({ listStyle, onLinkPress, skipHtml }),
    [listStyle, onLinkPress, skipHtml]
  );
  const elements = useMarkdown(content ?? '', {
    colorScheme: isDark ? 'dark' : 'light',
    renderer,
    styles: markdownStyles,
    theme,
    tokenizer,
  });
  return <View style={style}>{elements}</View>;
}

export default MarkdownContent;
