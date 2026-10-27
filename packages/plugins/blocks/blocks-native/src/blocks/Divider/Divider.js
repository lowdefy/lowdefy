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
import { StyleSheet, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { toPixels } from '@lowdefy/client-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

const sizeMargins = { small: 'marginXS', medium: 'margin', large: 'marginLG' };

// A solid line is the iOS separator, a hairline in the separator colour. A dashed or dotted border
// shows only when it runs all round a view on iOS, so those lines are a zero-height view with its
// border split over top and bottom.
function getLineStyle({ tokens, variant }) {
  if (variant === 'solid') {
    return { backgroundColor: tokens.colorSeparator, height: StyleSheet.hairlineWidth };
  }
  return {
    borderColor: tokens.colorSeparator,
    borderStyle: variant,
    borderWidth: tokens.lineWidth / 2,
    height: 0,
  };
}

function getVariant(properties) {
  if (properties.dashed === true) return 'dashed';
  return properties.variant ?? 'solid';
}

// The flex of the line before and after a title: antd keeps the line on the title's side at
// orientationMargin (5%) of the width.
function getLineFlex({ orientationMargin, titlePlacement }) {
  switch (titlePlacement) {
    case 'start':
      return [orientationMargin, 1 - orientationMargin];
    case 'end':
      return [1 - orientationMargin, orientationMargin];
    default:
      return [1, 1];
  }
}

// antd's Divider: a horizontal rule with an optional title in it, or a short vertical rule
// between inline blocks.
function Divider({ properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const lineStyle = [getLineStyle({ tokens, variant: getVariant(properties) }), styles.rail];
  if (properties.orientation === 'vertical') {
    return (
      <View
        style={[
          {
            alignSelf: 'center',
            marginHorizontal: tokens.verticalMarginInline ?? tokens.marginXS,
          },
          lineStyle,
          { height: 13, width: StyleSheet.hairlineWidth },
          styles.element,
        ]}
      />
    );
  }
  const margin = tokens[sizeMargins[properties.size ?? 'large']];
  const title = htmlToText(properties.title);
  if (type.isNone(title) || title === '') {
    return <View style={[{ marginVertical: margin }, lineStyle, styles.element]} />;
  }
  const plain = properties.plain === true;
  const textStyle = getIosTextStyle({
    color: tokens.colorSecondaryLabel,
    textStyle: plain ? 'footnote' : 'subheadline',
    tokens,
  });
  const { fontSize } = textStyle;
  const [startFlex, endFlex] = getLineFlex({
    orientationMargin: tokens.orientationMargin ?? 0.05,
    titlePlacement: properties.titlePlacement ?? 'center',
  });
  return (
    <View
      style={[
        { alignItems: 'center', flexDirection: 'row', marginVertical: margin },
        styles.element,
      ]}
    >
      <View style={[{ flex: startFlex }, lineStyle]} />
      <Text
        style={[
          textStyle,
          {
            fontWeight: plain ? '400' : '600',
            paddingHorizontal: toPixels({ fontSize, value: tokens.textPaddingInline ?? '0.75em' }),
          },
          styles.title,
        ]}
      >
        {title}
      </Text>
      <View style={[{ flex: endFlex }, lineStyle]} />
    </View>
  );
}

Divider.meta = meta;

export default Divider;
