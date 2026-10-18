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
import { type } from '@lowdefy/helpers';

import getButtonColors from './getButtonColors.js';
import getControlSize from '../../shared/getControlSize.js';
import meta from './meta.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

function getShapeStyle({ height, shape, size, tokens }) {
  if (shape === 'circle') {
    return { borderRadius: height / 2, paddingHorizontal: 0, width: height };
  }
  if (shape === 'round') {
    return { borderRadius: height / 2 };
  }
  return { borderRadius: size === 'large' ? tokens.borderRadiusLG : tokens.borderRadius };
}

// The spinner shows while the onClick actions run, from the engine's event loading, as on the
// web; the button is disabled meanwhile.
function Button({ blockId, components, events, loading, methods, properties, styles }) {
  const { tokens } = useBlockTokens({ properties });
  const actionLoading = events.onClick?.loading === true;
  const disabled = loading === true || actionLoading || properties.disabled === true;
  const { height, fontSize, paddingHorizontal } = getControlSize({ size: properties.size, tokens });
  const colors = getButtonColors({ properties, tokens });
  const title = type.isNone(properties.title) ? blockId : properties.title;
  const showTitle =
    properties.hideTitle !== true &&
    !(properties.shape === 'circle' && type.isNone(properties.title));
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ busy: actionLoading, disabled }}
      disabled={disabled}
      onPress={() => methods.triggerEvent({ name: 'onClick' })}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          alignSelf: properties.block === true ? 'stretch' : 'flex-start',
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderStyle: colors.borderStyle,
          borderWidth: colors.borderWidth,
          flexDirection: 'row',
          gap: tokens.marginXS,
          justifyContent: 'center',
          minHeight: height,
          opacity: disabled && !actionLoading ? 0.5 : 1,
          paddingHorizontal,
        },
        getShapeStyle({ height, shape: properties.shape, size: properties.size, tokens }),
        pressed ? { opacity: 0.7 } : null,
        styles.element,
      ]}
      testID={`${blockId}_button`}
    >
      {actionLoading ? (
        <ActivityIndicator color={colors.textColor} size="small" testID={`${blockId}_loading`} />
      ) : null}
      {!actionLoading && !type.isNone(properties.icon) ? (
        <components.Icon
          blockId={`${blockId}_icon`}
          events={events}
          properties={properties.icon}
          styles={{ element: [{ color: colors.textColor, fontSize }, styles.icon] }}
        />
      ) : null}
      {showTitle ? <Text style={{ color: colors.textColor, fontSize }}>{title}</Text> : null}
    </Pressable>
  );
}

Button.meta = meta;

export default Button;
