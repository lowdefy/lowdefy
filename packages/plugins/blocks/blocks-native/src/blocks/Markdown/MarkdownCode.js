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
import { ScrollView, Text, View } from 'react-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';

/**
 * A fenced code block as a rounded card in the monospace font, its language (when the fence
 * names one) above the code. Long lines scroll sideways rather than wrap, so code keeps its
 * shape.
 *
 * @param {Object} props
 * @param {string} [props.language]
 * @param {Object} props.palette The Markdown's palette (getMarkdownStyles).
 * @param {Object} [props.style] The card's style: its space below.
 * @param {string} props.text
 * @param {Object} props.textStyle The code's text style.
 */
function MarkdownCode({ language, palette, style, text, textStyle }) {
  const hasLanguage = typeof language === 'string' && language.trim() !== '';
  return (
    <View
      style={[
        { backgroundColor: palette.codeBackground, borderRadius: 12, overflow: 'hidden' },
        style,
      ]}
      testID="markdown-code"
    >
      {hasLanguage ? (
        <Text
          style={[
            getIosTextStyle({
              color: palette.secondaryLabel,
              textStyle: 'caption1',
              tokens: palette.tokens,
            }),
            { fontWeight: '500', paddingHorizontal: 14, paddingTop: 10 },
          ]}
        >
          {language.trim()}
        </Text>
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 12,
          paddingHorizontal: 14,
          paddingTop: hasLanguage ? 6 : 12,
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View>
          <Text selectable style={textStyle}>
            {text}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default MarkdownCode;
