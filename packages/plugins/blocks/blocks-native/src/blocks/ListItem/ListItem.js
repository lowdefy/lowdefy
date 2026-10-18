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

import ListItemAvatar from './ListItemAvatar.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

/**
 * An iOS-style list cell: an avatar or icon, a title and description, a detail on the right and
 * a chevron. It is pressable when it has an onClick event, and then shows the chevron unless
 * `chevron: false`.
 */
function ListItem({ blockId, components, events, methods, properties, styles }) {
  const { tokens } = useBlockTokens({ properties });
  const pressable = !type.isNone(events.onClick);
  const showChevron = properties.chevron ?? pressable;
  const title = properties.title ?? blockId;
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole={pressable ? 'button' : undefined}
      disabled={!pressable || properties.disabled === true}
      onPress={() => methods.triggerEvent({ name: 'onClick' })}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor: pressed ? tokens.colorFillTertiary : tokens.colorBgContainer,
          flexDirection: 'row',
          gap: tokens.marginSM,
          minHeight: tokens.controlHeightLG + tokens.paddingXS,
          paddingHorizontal: tokens.padding,
          paddingVertical: tokens.paddingXS,
        },
        styles.element,
      ]}
      testID={`${blockId}_item`}
    >
      {type.isObject(properties.avatar) ? (
        <ListItemAvatar
          avatar={properties.avatar}
          size={tokens.controlHeightLG}
          styles={styles}
          tokens={tokens}
        />
      ) : null}
      {!type.isNone(properties.icon) ? (
        <components.Icon
          blockId={`${blockId}_icon`}
          events={events}
          properties={properties.icon}
          styles={{ element: [{ color: tokens.colorIcon, fontSize: tokens.fontSizeLG }, styles.icon] }}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[{ color: tokens.colorText, fontSize: tokens.fontSizeLG }, styles.title]}>
          {title}
        </Text>
        {type.isString(properties.description) ? (
          <Text
            style={[
              { color: tokens.colorTextSecondary, fontSize: tokens.fontSize },
              styles.description,
            ]}
          >
            {properties.description}
          </Text>
        ) : null}
      </View>
      {type.isString(properties.extra) ? (
        <Text style={[{ color: tokens.colorTextTertiary, fontSize: tokens.fontSizeLG }, styles.extra]}>
          {properties.extra}
        </Text>
      ) : null}
      {showChevron ? (
        <Text
          importantForAccessibility="no"
          style={{ color: tokens.colorTextTertiary, fontSize: tokens.fontSizeLG * 1.5 }}
          testID={`${blockId}_chevron`}
        >
          ›
        </Text>
      ) : null}
    </Pressable>
  );
}

ListItem.meta = meta;

export default ListItem;
