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
import { type } from '@lowdefy/helpers';
import { convertStyle } from '@lowdefy/style-native';

import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';
import useComponentTokens from '../../useComponentTokens.js';

const LOADING_ROWS = ['38%', '100%', '100%', '61%'];

// antd's card padding tokens default to the global spacing tokens. A `padding` of compact or none
// overrides them, as on the web.
function getPadding({ padding, small, tokens }) {
  const header = small
    ? tokens.headerPaddingSM ?? tokens.paddingSM
    : tokens.headerPadding ?? tokens.paddingLG;
  const body = small
    ? tokens.bodyPaddingSM ?? tokens.paddingSM
    : tokens.bodyPadding ?? tokens.paddingLG;
  switch (padding) {
    case 'compact':
      return { body: 12, header: 12 };
    case 'none':
      return { body: 0, header };
    default:
      return { body, header };
  }
}

function LoadingRows({ tokens }) {
  return LOADING_ROWS.map((width, index) => (
    <SkeletonShape
      key={index}
      style={{ height: tokens.fontSize + 2, marginTop: index === 0 ? 0 : tokens.marginSM, width }}
    />
  ));
}

// antd's Card: an optional header with a title and extra blocks, a cover, the body and an action
// bar, in a rounded container. With an onClick event the whole card is pressable.
function Card({ content, events, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const small = properties.size === 'small';
  const inner = properties.inner === true;
  const bordered = properties.bordered !== false && properties.variant !== 'borderless';
  const padding = getPadding({ padding: properties.padding, small, tokens });
  const title = htmlToText(properties.title);
  const hasTitle = Boolean(content.title) || (type.isString(title) && title !== '');
  const hasHeader = hasTitle || Boolean(content.extra);
  const headerFontSize =
    small || inner
      ? tokens.headerFontSizeSM ?? tokens.fontSize
      : tokens.headerFontSize ?? tokens.fontSizeLG;
  const containerStyle = [
    {
      backgroundColor: tokens.colorBgContainer,
      borderColor: tokens.colorBorderSecondary,
      borderRadius: tokens.borderRadiusLG,
      borderWidth: bordered ? tokens.lineWidth : 0,
      overflow: 'hidden',
    },
    styles.element,
  ];
  const body = (
    <>
      {hasHeader ? (
        <View
          style={[
            {
              alignItems: 'center',
              backgroundColor: inner ? tokens.colorFillAlter : tokens.headerBg,
              borderBottomColor: tokens.colorBorderSecondary,
              borderBottomWidth: tokens.lineWidth,
              flexDirection: 'row',
              minHeight: small ? tokens.headerHeightSM ?? 38 : tokens.headerHeight ?? 56,
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
                  {
                    color: tokens.colorTextHeading,
                    fontSize: headerFontSize,
                    fontWeight: String(tokens.fontWeightStrong),
                  },
                  styles.title,
                ]}
              >
                {title}
              </Text>
            )}
          </View>
          {content.extra ? (
            <View style={[{ marginLeft: tokens.marginXS }, styles.extra]}>{content.extra()}</View>
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
        {properties.loading === true ? <LoadingRows tokens={tokens} /> : content.content?.()}
      </View>
      {content.actions ? (
        <View
          style={[
            {
              backgroundColor: tokens.actionsBg ?? tokens.colorBgContainer,
              borderTopColor: tokens.colorBorderSecondary,
              borderTopWidth: tokens.lineWidth,
              paddingHorizontal: padding.header,
              paddingVertical: tokens.paddingSM,
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
        style={containerStyle}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{body}</View>;
}

Card.meta = meta;

export default Card;
