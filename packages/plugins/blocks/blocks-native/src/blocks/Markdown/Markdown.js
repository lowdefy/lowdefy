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

import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Linking, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useMarkdown } from 'react-native-marked';

import ChipWidthContext from './ChipWidthContext.js';
import getMarkdownStyles from './getMarkdownStyles.js';
import MarkdownRenderer from './MarkdownRenderer.js';
import MarkdownTokenizer from './MarkdownTokenizer.js';
import meta from './meta.js';
import trimOuterSpace from './trimOuterSpace.js';
import useComponentTokens from '../../useComponentTokens.js';

const webPattern = /^https?:\/\//i;

// GitHub-flavoured markdown drawn with React Native views in the iOS typography. useMarkdown gives
// the elements rather than react-native-marked's FlatList, since the block sits in the page's
// scroll view. Every pressed link, chips included, runs onLinkPress when the block has it.
// Without it a web link opens in the in-app browser and any other link (mail, phone) through the
// system; a chip is not pressable.
function Markdown({ components, events, methods, properties, styles = {} }) {
  const { isDark, tokens } = useComponentTokens();
  const [width, setWidth] = useState(() => Dimensions.get('window').width - 32);
  const hasOnLinkPress = Boolean(events.onLinkPress);
  const skipHtml = properties.skipHtml === true;
  const linkChips = properties.linkChips;
  const {
    palette,
    styles: markdownStyles,
    theme,
  } = useMemo(() => getMarkdownStyles({ isDark, tokens }), [isDark, tokens]);
  const tokenizer = useMemo(() => new MarkdownTokenizer(), []);
  const onLinkPress = useCallback(
    (href) => {
      if (hasOnLinkPress) {
        methods.triggerEvent({ name: 'onLinkPress', event: { href } });
        return;
      }
      if (webPattern.test(href)) {
        WebBrowser.openBrowserAsync(href, { controlsColor: tokens.colorTint });
        return;
      }
      Linking.openURL(href);
    },
    [hasOnLinkPress, methods, tokens.colorTint]
  );
  const renderer = useMemo(
    () =>
      new MarkdownRenderer({
        Icon: components.Icon,
        linkChips,
        onChipPress: hasOnLinkPress ? onLinkPress : null,
        onLinkPress,
        palette,
        skipHtml,
      }),
    [components.Icon, hasOnLinkPress, linkChips, onLinkPress, palette, skipHtml]
  );
  const elements = useMarkdown(properties.content ?? '', {
    colorScheme: isDark ? 'dark' : 'light',
    renderer,
    styles: markdownStyles,
    theme,
    tokenizer,
  });
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.element}>
      <ChipWidthContext.Provider value={width}>
        {trimOuterSpace(elements)}
      </ChipWidthContext.Provider>
    </View>
  );
}

Markdown.meta = meta;

export default Markdown;
