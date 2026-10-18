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

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Renderer } from 'react-native-marked';

// react-native-marked's renderer, with links pressed through the block's onLinkPress and raw
// html dropped when skipHtml is set. Raw html is otherwise drawn as its source text, as the web
// block escapes it. The library applies a list's style to each item's marker, so the space
// below a list is a view around it.
class MarkdownRenderer extends Renderer {
  constructor({ listStyle, onLinkPress, skipHtml }) {
    super();
    this.listStyle = listStyle;
    this.onLinkPress = onLinkPress;
    this.skipHtml = skipHtml;
  }

  list(ordered, li, markerStyle, textStyle, startIndex) {
    return (
      <View key={this.getKey()} style={this.listStyle}>
        {super.list(ordered, li, markerStyle, textStyle, startIndex)}
      </View>
    );
  }

  link(children, href, styles, title) {
    return (
      <Text
        accessibilityLabel={title}
        accessibilityRole="link"
        key={this.getKey()}
        onPress={() => this.onLinkPress(href)}
        style={styles}
      >
        {children}
      </Text>
    );
  }

  linkImage(href, imageUrl, alt, style, title) {
    return (
      <Pressable
        accessibilityRole="link"
        key={this.getKey()}
        onPress={() => this.onLinkPress(href)}
      >
        {this.image(imageUrl, alt, style, title)}
      </Pressable>
    );
  }

  html(text, styles) {
    if (this.skipHtml) {
      return null;
    }
    return super.html(text, styles);
  }
}

export default MarkdownRenderer;
