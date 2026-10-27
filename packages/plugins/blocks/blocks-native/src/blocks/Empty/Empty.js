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

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import meta from './meta.js';

// iOS's ContentUnavailableView at two sizes: `default` for a screen, `simple` inside a list or card.
const SIZES = {
  default: { description: 'body', icon: 48, paddingVertical: 48, title: 'title2' },
  simple: { description: 'subheadline', icon: 32, paddingVertical: 24, title: 'headline' },
};

// A centred placeholder for nothing to show, as iOS's ContentUnavailableView: a large icon in the
// secondary label colour, a title, a line of description and an optional footer of blocks, such
// as a button that creates the first item. Without a title the description defaults to "No data".
function Empty({ blockId, components, content, properties, styles = {} }) {
  const { tokens } = useTheme();
  const size = SIZES[properties.image === 'simple' ? 'simple' : 'default'];
  const hasTitle = type.isString(properties.title) && properties.title !== '';
  const description = properties.description ?? (hasTitle ? null : 'No data');
  return (
    <View
      style={[
        { alignItems: 'center', paddingHorizontal: 24, paddingVertical: size.paddingVertical },
        styles.element,
      ]}
    >
      <View style={[{ marginBottom: 12 }, styles.image]}>
        <components.Icon
          properties={properties.icon ?? { name: 'Inbox', title: '' }}
          styles={{
            element: { color: tokens.colorSecondaryLabel, fontSize: size.icon },
          }}
          testID={`${blockId}_icon`}
        />
      </View>
      {hasTitle ? (
        <Text
          accessibilityRole="header"
          style={[
            getIosTextStyle({ textStyle: size.title, tokens }),
            { textAlign: 'center' },
            styles.title,
          ]}
        >
          {properties.title}
        </Text>
      ) : null}
      {type.isNone(description) || description === '' ? null : (
        <Text
          style={[
            getIosTextStyle({
              color: tokens.colorSecondaryLabel,
              textStyle: size.description,
              tokens,
            }),
            { marginTop: hasTitle ? 4 : 0, textAlign: 'center' },
            styles.description,
          ]}
        >
          {description}
        </Text>
      )}
      {content.footer ? (
        <View style={[{ marginTop: 16 }, styles.footer]}>{content.footer()}</View>
      ) : null}
    </View>
  );
}

Empty.meta = meta;

export default Empty;
