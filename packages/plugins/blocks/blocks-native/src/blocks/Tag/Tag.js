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

import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { getSafeHref, type } from '@lowdefy/helpers';

import getTagColors from './getTagColors.js';
import getTagDotColor from './getTagDotColor.js';
import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

const schemePattern = /^[a-z][a-z0-9+.-]*:/i;

// Pill metrics: a small tag in caption (12), the default in footnote (13), both semibold.
const SIZES = {
  small: { dot: 6, fontSize: 12, height: 20, lineHeight: 16, paddingHorizontal: 7 },
  default: { dot: 7, fontSize: 13, height: 24, lineHeight: 18, paddingHorizontal: 9 },
};

// A phone opens a link outside the app, so only a URL with a safe scheme links; a relative path
// names nothing outside the app.
function getExternalHref(href) {
  const safe = getSafeHref(href);
  if (type.isString(safe) && schemePattern.test(safe)) {
    return safe;
  }
  return undefined;
}

// antd's Tag as an iOS pill: the title in its tone over a tint of it, with an optional leading
// dot or icon. A closable tag shows a close button that fires onClose and removes the tag;
// onClick or an href make the tag pressable.
function Tag({ blockId, components, events, methods, properties, styles = {} }) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const [closed, setClosed] = useState(false);
  if (closed) {
    return null;
  }
  const size = SIZES[properties.size === 'small' ? 'small' : 'default'];
  const disabled = properties.disabled === true;
  const colors = getTagColors({
    color: properties.color,
    isDark,
    tokens,
    variant: properties.variant ?? 'filled',
  });
  const textColor = disabled ? tokens.colorTertiaryLabel : colors.color;
  const iconStyle = { color: textColor, fontSize: size.fontSize };
  const href = getExternalHref(properties.href);
  const pressable = !disabled && (Boolean(events.onClick) || href !== undefined);
  const onPress = () => {
    if (events.onClick) {
      methods.triggerEvent({ name: 'onClick' });
    }
    if (href !== undefined) {
      Linking.openURL(href).catch(() => {});
    }
  };
  const title = type.isString(properties.title) ? htmlToText(properties.title) : null;
  const hasDot = !type.isNone(properties.dot) && properties.dot !== false;
  const Container = pressable ? Pressable : View;
  let accessibilityRole;
  if (pressable) {
    accessibilityRole = href === undefined ? 'button' : 'link';
  }
  return (
    <Container
      accessibilityRole={accessibilityRole}
      accessibilityState={disabled ? { disabled: true } : undefined}
      onPress={pressable ? onPress : undefined}
      style={[
        {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: disabled ? tokens.colorQuaternarySystemFill : colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: size.height / 2,
          borderWidth: colors.borderWidth,
          flexDirection: 'row',
          gap: 5,
          minHeight: size.height,
          paddingHorizontal: size.paddingHorizontal,
        },
        styles.element,
      ]}
    >
      {hasDot ? (
        <View
          style={[
            {
              backgroundColor: getTagDotColor({
                accent: colors.accent,
                dot: properties.dot,
                tokens,
              }),
              borderRadius: size.dot / 2,
              height: size.dot,
              width: size.dot,
            },
            styles.dot,
          ]}
          testID={`${blockId}_dot`}
        />
      ) : null}
      {properties.icon ? (
        <components.Icon
          properties={properties.icon}
          styles={{ element: [iconStyle, styles.icon] }}
          testID={`${blockId}_icon`}
        />
      ) : null}
      {title === null ? null : (
        <Text
          numberOfLines={1}
          style={{
            color: textColor,
            fontSize: size.fontSize,
            fontWeight: '600',
            lineHeight: size.lineHeight,
          }}
        >
          {title}
        </Text>
      )}
      {properties.closable === true ? (
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={8}
          onPress={() => {
            methods.triggerEvent({ name: 'onClose' });
            setClosed(true);
          }}
          testID={`${blockId}_close`}
        >
          <components.Icon
            properties={properties.closeIcon ?? { name: 'close', title: '' }}
            styles={{
              element: [{ color: textColor, fontSize: size.fontSize - 2 }, styles.closeIcon],
            }}
          />
        </Pressable>
      ) : null}
    </Container>
  );
}

Tag.meta = meta;

export default Tag;
