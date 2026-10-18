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
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { convertStyle } from '@lowdefy/style-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';
import useComponentTokens from '../../useComponentTokens.js';

const LOADING_ROWS = ['38%', '100%', '100%', '61%'];

// The iOS grouped section's corner radius.
const CELL_RADIUS = 10;

// iOS insets a cell's content 16 points (12 for a small card). antd's card padding tokens, set in
// the block's theme, and a `padding` of compact or none override them, as on the web.
function getPadding({ padding, small, tokens }) {
  const header = small ? tokens.headerPaddingSM ?? 12 : tokens.headerPadding ?? 16;
  const body = small ? tokens.bodyPaddingSM ?? 12 : tokens.bodyPadding ?? 16;
  switch (padding) {
    case 'compact':
      return { body: 12, header: 12 };
    case 'none':
      return { body: 0, header };
    default:
      return { body, header };
  }
}

// The block theme's header font size, over the headline size.
function getHeaderFontSize({ compact, tokens }) {
  const fontSize = compact ? tokens.headerFontSizeSM : tokens.headerFontSize;
  return type.isNumber(fontSize) ? { fontSize } : null;
}

function LoadingRows() {
  return LOADING_ROWS.map((width, index) => (
    <SkeletonShape key={index} style={{ height: 14, marginTop: index === 0 ? 0 : 10, width }} />
  ));
}

// antd's Card as an iOS grouped section: a cell on the grouped background with a rounded corner
// and no border, an optional header with a headline title and extra blocks, a cover, the body and
// an action bar, divided by hairline separators. With an onClick event the whole card is
// pressable and highlights while pressed, as a cell does.
function Card({ content, events, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const small = properties.size === 'small';
  const inner = properties.inner === true;
  const padding = getPadding({ padding: properties.padding, small, tokens });
  const title = htmlToText(properties.title);
  const hasTitle = Boolean(content.title) || (type.isString(title) && title !== '');
  const hasHeader = hasTitle || Boolean(content.extra);
  const separator = { borderColor: tokens.colorSeparator };
  const containerStyle = (pressed) => [
    {
      backgroundColor: pressed ? tokens.colorCellPressed : tokens.colorCell,
      borderRadius: properties.theme?.borderRadiusLG ?? CELL_RADIUS,
      overflow: 'hidden',
    },
    styles.element,
  ];
  const body = (
    <>
      {hasHeader ? (
        <View
          style={[
            separator,
            {
              alignItems: 'center',
              backgroundColor: inner ? tokens.colorCellNested : tokens.headerBg,
              borderBottomWidth: StyleSheet.hairlineWidth,
              flexDirection: 'row',
              minHeight: small ? tokens.headerHeightSM ?? 38 : tokens.headerHeight ?? 44,
              paddingHorizontal: padding.header,
            },
            styles.header,
          ]}
        >
          <View style={{ flex: 1 }}>
            {content.title ? (
              content.title()
            ) : (
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={[
                  getIosTextStyle({
                    textStyle: small || inner ? 'subheadline' : 'headline',
                    tokens,
                  }),
                  small || inner ? { fontWeight: '600' } : null,
                  getHeaderFontSize({ compact: small || inner, tokens }),
                  styles.title,
                ]}
              >
                {title}
              </Text>
            )}
          </View>
          {content.extra ? (
            <View style={[{ marginLeft: 8 }, styles.extra]}>{content.extra()}</View>
          ) : null}
        </View>
      ) : null}
      {content.cover ? <View style={styles.cover}>{content.cover()}</View> : null}
      <View
        style={[
          type.isString(padding.body)
            ? convertStyle({ padding: padding.body }).style
            : { padding: padding.body },
          styles.body,
        ]}
      >
        {properties.loading === true ? <LoadingRows /> : content.content?.()}
      </View>
      {content.actions ? (
        <View
          style={[
            separator,
            {
              backgroundColor: tokens.actionsBg,
              borderTopWidth: StyleSheet.hairlineWidth,
              paddingHorizontal: padding.header,
              paddingVertical: 10,
            },
            styles.actions,
          ]}
        >
          {content.actions()}
        </View>
      ) : null}
    </>
  );
  if (events.onClick) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => methods.triggerEvent({ name: 'onClick' })}
        style={({ pressed }) => containerStyle(pressed)}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={containerStyle(false)}>{body}</View>;
}

Card.meta = meta;

export default Card;
