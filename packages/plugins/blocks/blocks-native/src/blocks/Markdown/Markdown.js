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

import React, { Fragment, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { useMarkdown } from 'react-native-marked';

import getMarkdownStyles from './getMarkdownStyles.js';
import MarkdownRenderer from './MarkdownRenderer.js';
import MarkdownTokenizer from './MarkdownTokenizer.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

// GitHub-flavoured markdown drawn with React Native views. useMarkdown gives the elements rather
// than react-native-marked's FlatList, since the block sits in the page's scroll view. A pressed
// link runs onLinkPress when the block has it, and otherwise leaves the app through the system,
// as an outside Link does.
function Markdown({ events, methods, properties, styles = {} }) {
  const { isDark, tokens } = useComponentTokens();
  const hasOnLinkPress = Boolean(events.onLinkPress);
  const skipHtml = properties.skipHtml === true;
  const {
    listStyle,
    styles: markdownStyles,
    theme,
  } = useMemo(() => getMarkdownStyles({ tokens }), [tokens]);
  const tokenizer = useMemo(() => new MarkdownTokenizer(), []);
  const renderer = useMemo(
    () =>
      new MarkdownRenderer({
        listStyle,
        onLinkPress: (href) => {
          if (hasOnLinkPress) {
            methods.triggerEvent({ name: 'onLinkPress', event: { href } });
            return;
          }
          Linking.openURL(href);
        },
        skipHtml,
      }),
    [hasOnLinkPress, listStyle, methods, skipHtml]
  );
  const elements = useMarkdown(properties.content ?? '', {
    colorScheme: isDark ? 'dark' : 'light',
    renderer,
    styles: markdownStyles,
    theme,
    tokenizer,
  });
  return (
    <View style={styles.element}>
      {elements.map((element, index) => (
        <Fragment key={index}>{element}</Fragment>
      ))}
    </View>
  );
}

Markdown.meta = meta;

export default Markdown;
