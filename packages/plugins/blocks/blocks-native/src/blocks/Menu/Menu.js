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

import getMenuActions from './getMenuActions.js';
import meta from './meta.js';
import NativeMenu from '../../shared/NativeMenu.js';
import useComponentTokens from '../../useComponentTokens.js';

// The trigger drawn when the content slot is empty: a plain iOS button, its icon and title in
// the tint colour.
function DefaultTrigger({ blockId, components, properties, styles, tokens }) {
  const color = properties.color ?? tokens.colorPrimary;
  const title = type.isString(properties.title) ? properties.title : null;
  return (
    <View
      accessibilityLabel={title ?? properties.icon?.title ?? 'Menu'}
      accessibilityRole="button"
      style={[
        {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          justifyContent: 'center',
          minHeight: 44,
          minWidth: 44,
        },
        styles.element,
      ]}
    >
      {type.isNone(properties.icon) ? null : (
        <components.Icon
          blockId={`${blockId}_icon`}
          properties={properties.icon}
          styles={{ element: [{ color, fontSize: 20 }, styles.icon] }}
        />
      )}
      {title === null ? null : <Text style={[{ color, fontSize: 17 }, styles.title]}>{title}</Text>}
    </View>
  );
}

/**
 * A native menu: a SwiftUI Menu on iOS (or a ContextMenu with `openOn: longPress`), a Material
 * dropdown menu on Android. Its trigger is the content slot's blocks, or else an icon and title
 * drawn as a plain button. Picking an item fires onSelect with the item's id.
 *
 * Items take an SF Symbol icon, drawn on iOS, and can be checked, destructive or disabled; an
 * item with items is a titled section, or a nested menu with `submenu: true`.
 */
function Menu({ blockId, components, content, loading, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  return (
    <NativeMenu
      actions={getMenuActions({ items: properties.items ?? [] })}
      disabled={loading === true || properties.disabled === true}
      fullWidth={properties.block === true}
      menuTitle={properties.menuTitle}
      onSelect={(id) => methods.triggerEvent({ name: 'onSelect', event: { id } })}
      openOnLongPress={properties.openOn === 'longPress'}
      testID={`${blockId}_menu`}
    >
      {content.content ? (
        content.content()
      ) : (
        <DefaultTrigger
          blockId={blockId}
          components={components}
          properties={properties}
          styles={styles}
          tokens={tokens}
        />
      )}
    </NativeMenu>
  );
}

Menu.meta = meta;

export default Menu;
