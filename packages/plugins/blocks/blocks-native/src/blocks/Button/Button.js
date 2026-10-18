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
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { formatIconTitle } from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import getButtonColors from './getButtonColors.js';
import getControlSize from '../../shared/getControlSize.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

function getShapeStyle({ borderRadius, height, shape }) {
  if (shape === 'circle') {
    return { borderRadius: height / 2, paddingHorizontal: 0, width: height };
  }
  if (shape === 'round') {
    return { borderRadius: height / 2 };
  }
  return { borderRadius };
}

function getIconName(icon) {
  if (type.isString(icon)) return icon;
  return icon?.name;
}

// An iOS button: filled (solid), tinted, gray or plain, at a 44 point default height, with an
// icon before or after the title. A Button without a title shows its icon alone; one with neither
// shows its block id. Pressing dims or darkens it, as iOS does. The spinner shows while the
// onClick actions run, from the engine's event loading, as on the web; the button is disabled
// meanwhile.
function Button({ blockId, components, events, loading, methods, properties, styles }) {
  const { isDark, tokens } = useBlockTokens({ properties });
  const actionLoading = events.onClick?.loading === true;
  const disabled = loading === true || actionLoading || properties.disabled === true;
  const { borderRadius, fontSize, height, paddingHorizontal } = getControlSize({
    size: properties.size,
  });
  const colors = getButtonColors({ isDark, properties, tokens });
  const hasIcon = !type.isNone(properties.icon);
  let title = null;
  if (type.isString(properties.title)) title = properties.title;
  else if (!hasIcon) title = blockId;
  const showTitle =
    title !== null && properties.hideTitle !== true && properties.shape !== 'circle';
  const accessibilityLabel = title ?? formatIconTitle(getIconName(properties.icon));
  const iconEnd = properties.iconPlacement === 'end';
  const icon =
    !actionLoading && hasIcon ? (
      <components.Icon
        blockId={`${blockId}_icon`}
        events={events}
        properties={properties.icon}
        styles={{ element: [{ color: colors.textColor, fontSize }, styles.icon] }}
      />
    ) : null;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: actionLoading, disabled }}
      disabled={disabled}
      onPress={() => methods.triggerEvent({ name: 'onClick' })}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          alignSelf: properties.block === true ? 'stretch' : 'flex-start',
          backgroundColor: pressed ? colors.pressedColor : colors.backgroundColor,
          borderColor: colors.borderColor,
          borderStyle: colors.borderStyle,
          borderWidth: colors.borderWidth,
          flexDirection: 'row',
          gap: 6,
          justifyContent: 'center',
          minHeight: height,
          minWidth: height,
          opacity: disabled && !actionLoading ? 0.4 : 1,
          paddingHorizontal,
        },
        getShapeStyle({ borderRadius, height, shape: properties.shape }),
        pressed ? { opacity: colors.pressedOpacity } : null,
        styles.element,
      ]}
      testID={`${blockId}_button`}
    >
      {actionLoading ? (
        <ActivityIndicator color={colors.textColor} size="small" testID={`${blockId}_loading`} />
      ) : null}
      {iconEnd ? null : icon}
      {showTitle ? (
        <Text
          numberOfLines={1}
          style={{
            color: colors.textColor,
            fontSize,
            fontWeight: colors.plain ? '400' : '600',
          }}
        >
          {title}
        </Text>
      ) : null}
      {iconEnd ? icon : null}
    </Pressable>
  );
}

Button.meta = meta;

export default Button;
