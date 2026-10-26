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

import React, { useState } from 'react';
import { Text } from 'react-native';
import { Image } from 'expo-image';

const PLACEHOLDER_HEIGHT = 160;

/**
 * A markdown image, loaded and cached by expo-image (svg included), in place of
 * react-native-marked's MDImage: that one sized itself with Image.getSize in an effect with no
 * dependencies, so it asked again on every render, and had no height when the size could not be
 * read, so the image never showed. Until it loads the image holds a rounded fill; then it takes
 * its own aspect ratio, as wide as it is or the width of the text, whichever is less, as a web
 * page draws it. An image that fails draws its alt text, as a browser does. Give it a `key` of
 * its url, so a new picture starts over.
 *
 * @param {Object} props
 * @param {string} [props.alt]
 * @param {Object} props.palette The Markdown palette (getMarkdownStyles).
 * @param {string} props.uri
 */
function MarkdownImage({ alt, palette, uri }) {
  const [size, setSize] = useState(null);
  const [failed, setFailed] = useState(false);
  if (failed) {
    if (!alt) {
      return null;
    }
    return <Text style={[palette.text, { color: palette.secondaryLabel }]}>{alt}</Text>;
  }
  const sizeStyle =
    size === null
      ? { backgroundColor: palette.codeBackground, height: PLACEHOLDER_HEIGHT }
      : { aspectRatio: size.width / size.height, maxWidth: size.width };
  return (
    <Image
      accessibilityLabel={alt}
      accessible={Boolean(alt)}
      cachePolicy="memory-disk"
      contentFit="contain"
      onError={() => setFailed(true)}
      onLoad={({ source }) => setSize({ height: source.height, width: source.width })}
      recyclingKey={uri}
      source={{ uri }}
      style={[{ borderRadius: 10, width: '100%' }, sizeStyle]}
      testID="markdown-image"
    />
  );
}

export default MarkdownImage;
