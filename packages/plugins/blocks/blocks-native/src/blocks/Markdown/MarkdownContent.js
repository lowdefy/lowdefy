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
import trimOuterSpace from './trimOuterSpace.js';
import useComponentTokens from '../../useComponentTokens.js';

const webPattern = /^https?:\/\//i;
const appPathPattern = /^\/(?!\/)/;

/**
 * GitHub-flavoured markdown drawn with React Native views in the iOS typography and the theme's
 * semantic colours: the Markdown block's renderer, which AgentChat draws its replies with, so the
 * two read the same. useMarkdown gives the elements rather than react-native-marked's FlatList,
 * since the markdown sits in the page's scroll view; the space above the first element and below
 * the last is trimmed (trimOuterSpace).
 *
 * Every pressed link, link chips included, runs `onLinkPress` when the host block gives one.
 * Without it a web link opens in the in-app browser (expo-web-browser, its controls in the tint)
 * and any other link (mail, phone) through the system, and a chip is not pressable. An app path
 * (`/orders/42`) goes to `onPathPress` when the host gives one, which opens it as a page. Any
 * other path, in a link or an image, is taken against the app server as a browser on the app's
 * page would (components.resolveUrl).
 *
 * @param {Object} props
 * @param {Object} props.components The host block's components (components.Icon for chip icons,
 *   components.resolveUrl for paths).
 * @param {string} props.content
 * @param {Object[]} [props.linkChips] Links drawn as inline chips, by scheme or pattern
 *   (schemas/linkChips).
 * @param {((href: string) => void)|null} [props.onLinkPress]
 * @param {((href: string) => void)|null} [props.onPathPress] Opens an app path in the app.
 * @param {boolean} [props.skipHtml] Leave raw html out rather than drawing its source.
 * @param {Object} [props.style]
 */
function MarkdownContent({
  components,
  content,
  linkChips,
  onLinkPress = null,
  onPathPress = null,
  skipHtml = false,
  style,
}) {
  const { isDark, tokens } = useComponentTokens();
  const [width, setWidth] = useState(() => Dimensions.get('window').width - 32);
  const {
    palette,
    styles: markdownStyles,
    theme,
  } = useMemo(() => getMarkdownStyles({ isDark, tokens }), [isDark, tokens]);
  const tokenizer = useMemo(() => new MarkdownTokenizer(), []);
  const { resolveUrl } = components;
  const openLink = useCallback(
    (href) => {
      if (onLinkPress !== null) {
        onLinkPress(href);
        return;
      }
      if (onPathPress !== null && appPathPattern.test(href)) {
        onPathPress(href);
        return;
      }
      const url = resolveUrl(href);
      if (webPattern.test(url)) {
        WebBrowser.openBrowserAsync(url, { controlsColor: tokens.colorTint });
        return;
      }
      // A scheme no app on the phone opens (an unknown `slack:`) rejects; the press does nothing.
      Linking.openURL(url).catch(() => {});
    },
    [onLinkPress, onPathPress, resolveUrl, tokens.colorTint]
  );
  const renderer = useMemo(
    () =>
      new MarkdownRenderer({
        Icon: components.Icon,
        linkChips,
        onChipPress: onLinkPress === null ? null : openLink,
        onLinkPress: openLink,
        palette,
        resolveUrl,
        skipHtml,
      }),
    [components.Icon, linkChips, onLinkPress, openLink, palette, resolveUrl, skipHtml]
  );
  const elements = useMarkdown(content ?? '', {
    colorScheme: isDark ? 'dark' : 'light',
    renderer,
    styles: markdownStyles,
    theme,
    tokenizer,
  });
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={style}>
      <ChipWidthContext.Provider value={width}>
        {trimOuterSpace(elements)}
      </ChipWidthContext.Provider>
    </View>
  );
}

export default MarkdownContent;
