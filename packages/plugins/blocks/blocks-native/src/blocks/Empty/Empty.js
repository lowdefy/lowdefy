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
import { Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { useTheme } from '@lowdefy/client-native';

import EmptyImage from './EmptyImage.js';
import meta from './meta.js';

const imageHeights = { default: 100, simple: 40 };

// A centred placeholder for nothing to show: the empty tray (or an icon), a description and an
// optional footer of blocks, as antd's Empty.
function Empty({ blockId, components, content, properties, styles = {} }) {
  const { tokens } = useTheme();
  const image = properties.image ?? 'default';
  const description = properties.description ?? 'No data';
  const imageHeight = imageHeights[image];
  return (
    <View style={[{ alignItems: 'center', paddingVertical: tokens.paddingLG }, styles.element]}>
      <View style={[{ marginBottom: tokens.marginXS }, styles.image]}>
        {type.isNone(properties.icon) ? (
          <EmptyImage height={imageHeight} tokens={tokens} />
        ) : (
          <components.Icon
            properties={properties.icon}
            styles={{ element: { color: tokens.colorTextQuaternary, fontSize: imageHeight / 2 } }}
            testID={`${blockId}_icon`}
          />
        )}
      </View>
      {description === '' ? null : (
        <Text
          style={[
            { color: tokens.colorTextDescription, fontSize: tokens.fontSize, textAlign: 'center' },
            styles.description,
          ]}
        >
          {description}
        </Text>
      )}
      {content.footer ? (
        <View style={[{ marginTop: tokens.margin }, styles.footer]}>{content.footer()}</View>
      ) : null}
    </View>
  );
}

Empty.meta = meta;

export default Empty;
