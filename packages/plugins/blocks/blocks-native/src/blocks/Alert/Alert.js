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
import { convertStyle } from '@lowdefy/style-native';

import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

const typeTokens = {
  error: 'Error',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
};

// antd's Alert: a tinted box in the type's colours with its icon, a message, an optional
// description and an action slot. A closable alert fires onClose, hides, then fires afterClose.
function Alert({ blockId, components, content, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const [closed, setClosed] = useState(false);
  if (closed) {
    return null;
  }
  const banner = properties.banner === true;
  // antd's default type: a banner warns, anything else informs.
  const alertType = properties.type ?? (banner ? 'warning' : 'info');
  const colorName = typeTokens[alertType];
  const description = htmlToText(properties.description);
  const hasDescription = type.isString(description) && description !== '';
  const message = htmlToText(properties.message);
  const hasCloseText = !type.isNone(properties.closeText) && properties.closeText !== '';
  const closable = properties.closable === true || hasCloseText;
  // The global colorIcon is antd's grey for icons; only the block's own colorIcon replaces the
  // type colour.
  const iconColor = properties.theme?.colorIcon ?? tokens[`color${colorName}`];
  const padding = convertStyle({
    padding: hasDescription
      ? tokens.withDescriptionPadding ?? '20px 24px'
      : tokens.defaultPadding ?? '8px 12px',
  }).style;
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
          alignItems: hasDescription ? 'flex-start' : 'center',
          backgroundColor: tokens[`color${colorName}Bg`],
          borderColor: tokens[`color${colorName}Border`],
          borderRadius: banner ? 0 : tokens.borderRadiusLG,
          borderWidth: banner || properties.variant === 'filled' ? 0 : tokens.lineWidth,
          flexDirection: 'row',
          gap: hasDescription ? tokens.marginSM : tokens.marginXS,
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
                fontSize: hasDescription ? tokens.withDescriptionIconSize ?? 24 : tokens.fontSize,
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
              {
                color: hasDescription ? tokens.colorTextHeading : tokens.colorText,
                fontSize: hasDescription ? tokens.fontSizeLG : tokens.fontSize,
                lineHeight: tokens.fontSize * tokens.lineHeight,
                marginBottom: hasDescription ? tokens.marginXS : 0,
              },
              styles.message,
            ]}
          >
            {message}
          </Text>
        )}
        {hasDescription ? (
          <Text
            style={[
              {
                color: tokens.colorText,
                fontSize: tokens.fontSize,
                lineHeight: tokens.fontSize * tokens.lineHeight,
              },
              styles.description,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {content.action ? <View style={styles.action}>{content.action()}</View> : null}
      {closable ? (
        <Pressable
          accessibilityLabel={hasCloseText ? properties.closeText : 'Close'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={close}
          style={styles.closeIcon}
          testID={`${blockId}_close`}
        >
          {hasCloseText ? (
            <Text style={{ color: tokens.colorTextDescription, fontSize: tokens.fontSizeSM }}>
              {properties.closeText}
            </Text>
          ) : (
            <components.Icon
              properties={properties.closeIcon ?? { name: 'close', title: '' }}
              styles={{ element: { color: tokens.colorIcon, fontSize: tokens.fontSizeSM } }}
            />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

Alert.meta = meta;

export default Alert;
