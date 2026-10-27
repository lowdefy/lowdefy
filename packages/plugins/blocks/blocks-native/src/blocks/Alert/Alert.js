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
import { Pressable, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { withAlpha } from '@lowdefy/client-native';
import { convertStyle } from '@lowdefy/style-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

// The colour each type tints the callout with; info takes the app's tint.
const typeTokens = {
  error: 'colorError',
  info: 'colorTint',
  success: 'colorSuccess',
  warning: 'colorWarning',
};

// antd's Alert as an iOS callout: a rounded box tinted in the type's colour with its icon, the
// message (a headline over a description, when it has one), an action slot and a close button.
// `variant: outlined` adds a border of the type colour. A closable alert fires onClose, hides,
// then fires afterClose.
function Alert({ blockId, components, content, methods, properties, styles = {} }) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const [closed, setClosed] = useState(false);
  if (closed) {
    return null;
  }
  const banner = properties.banner === true;
  // antd's default type: a banner warns, anything else informs.
  const alertType = properties.type ?? (banner ? 'warning' : 'info');
  const typeColor = tokens[typeTokens[alertType]];
  const description = htmlToText(properties.description);
  const hasDescription = type.isString(description) && description !== '';
  const message = htmlToText(properties.message);
  const hasCloseText = !type.isNone(properties.closeText) && properties.closeText !== '';
  const closable = properties.closable === true || hasCloseText;
  // The global colorIcon is antd's grey for icons; only the block's own colorIcon replaces the
  // type colour.
  const iconColor = properties.theme?.colorIcon ?? typeColor;
  const padding = convertStyle({
    padding: hasDescription
      ? tokens.withDescriptionPadding ?? '14px 16px'
      : tokens.defaultPadding ?? '12px 14px',
  }).style;
  const outlined = properties.variant === 'outlined' && !banner;
  const close = async () => {
    setClosed(true);
    await methods.triggerEvent({ name: 'onClose' });
    methods.triggerEvent({ name: 'afterClose' });
  };
  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          alignItems: 'flex-start',
          backgroundColor: withAlpha({ alpha: isDark ? 0.2 : 0.1, color: typeColor }),
          borderColor: withAlpha({ alpha: 0.4, color: typeColor }),
          borderRadius: banner ? 0 : 12,
          borderWidth: outlined ? tokens.lineWidth : 0,
          flexDirection: 'row',
          gap: 10,
        },
        padding,
        styles.element,
      ]}
    >
      {properties.showIcon === false ? null : (
        <components.Icon
          properties={properties.icon ?? { name: alertType, title: '' }}
          styles={{
            element: [
              {
                color: iconColor,
                fontSize: hasDescription ? tokens.withDescriptionIconSize ?? 22 : 20,
                marginTop: 1,
              },
              styles.icon,
            ],
          }}
          testID={`${blockId}_icon`}
        />
      )}
      <View style={{ flex: 1 }}>
        {type.isNone(message) ? null : (
          <Text
            style={[
              getIosTextStyle({ textStyle: hasDescription ? 'headline' : 'subheadline', tokens }),
              { marginBottom: hasDescription ? 2 : 0, marginTop: hasDescription ? 0 : 1 },
              styles.message,
            ]}
          >
            {message}
          </Text>
        )}
        {hasDescription ? (
          <Text
            style={[
              getIosTextStyle({
                color: tokens.colorSecondaryLabel,
                textStyle: 'subheadline',
                tokens,
              }),
              styles.description,
            ]}
          >
            {description}
          </Text>
        ) : null}
        {content.action ? (
          <View style={[{ marginTop: hasDescription ? 10 : 6 }, styles.action]}>
            {content.action()}
          </View>
        ) : null}
      </View>
      {closable ? (
        <Pressable
          accessibilityLabel={hasCloseText ? properties.closeText : 'Close'}
          accessibilityRole="button"
          hitSlop={10}
          onPress={close}
          style={[{ marginTop: 2 }, styles.closeIcon]}
          testID={`${blockId}_close`}
        >
          {hasCloseText ? (
            <Text style={getIosTextStyle({ color: typeColor, textStyle: 'subheadline', tokens })}>
              {properties.closeText}
            </Text>
          ) : (
            <components.Icon
              properties={properties.closeIcon ?? { name: 'close', title: '' }}
              styles={{ element: { color: tokens.colorSecondaryLabel, fontSize: 16 } }}
            />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

Alert.meta = meta;

export default Alert;
