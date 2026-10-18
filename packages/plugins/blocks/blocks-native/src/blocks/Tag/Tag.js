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
import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

const schemePattern = /^[a-z][a-z0-9+.-]*:/i;

// A phone opens a link outside the app, so only a URL with a safe scheme links; a relative path
// names nothing outside the app.
function getExternalHref(href) {
  const safe = getSafeHref(href);
  if (type.isString(safe) && schemePattern.test(safe)) {
    return safe;
  }
  return undefined;
}

// antd's Tag: a small coloured label with an optional icon. A closable tag shows a close button
// that fires onClose and removes the tag; onClick or an href make the tag pressable.
function Tag({ blockId, components, events, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const [closed, setClosed] = useState(false);
  if (closed) {
    return null;
  }
  const disabled = properties.disabled === true;
  const colors = getTagColors({
    color: properties.color,
    tokens,
    variant: properties.variant ?? 'filled',
  });
  const textColor = disabled ? tokens.colorTextDisabled : colors.color;
  const iconStyle = { color: textColor, fontSize: tokens.fontSizeSM };
  const href = getExternalHref(properties.href);
  const pressable = !disabled && (Boolean(events.onClick) || href !== undefined);
  const onPress = () => {
    if (events.onClick) {
      methods.triggerEvent({ name: 'onClick' });
    }
    if (href !== undefined) {
      Linking.openURL(href);
    }
  };
  const title = type.isString(properties.title)
    ? htmlToText(properties.title)
    : properties.title ?? blockId;
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
          backgroundColor: disabled ? tokens.colorBgContainerDisabled : colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: tokens.borderRadiusSM,
          borderWidth: tokens.lineWidth,
          flexDirection: 'row',
          gap: tokens.marginXXS,
          paddingHorizontal: 7,
        },
        styles.element,
      ]}
    >
      {properties.icon ? (
        <components.Icon
          properties={properties.icon}
          styles={{ element: [iconStyle, styles.icon] }}
          testID={`${blockId}_icon`}
        />
      ) : null}
      <Text style={{ color: textColor, fontSize: tokens.fontSizeSM, lineHeight: 20 }}>{title}</Text>
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
            styles={{ element: [{ color: tokens.colorIcon, fontSize: 10 }, styles.closeIcon] }}
          />
        </Pressable>
      ) : null}
    </Container>
  );
}

Tag.meta = meta;

export default Tag;
