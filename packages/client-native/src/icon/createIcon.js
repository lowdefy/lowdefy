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
import { Animated, StyleSheet } from 'react-native';
import { type } from '@lowdefy/helpers';

import formatIconTitle from './formatIconTitle.js';
import IconSvg from './Icon.js';
import toPixels from '../style/toPixels.js';
import useSpin from './useSpin.js';
import useTheme from '../theme/useTheme.js';

const MISSING_COLOR = '#F00';

// Drawn when neither the icon nor `icon-missing` is in the icon data: an empty svg keeps the
// icon's box, as the web's pending icon does.
const EMPTY_ICON = { node: [] };

/**
 * The native icon renderer: the web client's `components.Icon` for a phone. It draws the icon
 * node data the build resolves (semantic names, aliases and sets such as `tabler:`) with
 * react-native-svg, so `House` and `tabler:truck` look the same on every surface. A renderer
 * installs it as `lowdefy._internal.components.Icon` (initNativeLowdefy does), and blocks draw
 * every icon through it. It draws with Icon, the IconData renderer the shell's menus use too.
 *
 * The props follow the web's: `properties` is an icon name or the Icon block's properties. An
 * element style's `color` and `fontSize` play the part CSS inheritance plays on the web: the
 * colour `currentColor` draws with and the size `1em` stands for.
 *
 * @param {Object} params
 * @param {Object} params.icons Icon data by name, as the build loads it: `{ node, attrs, size }`.
 *   It holds `loading` (drawn while a spin or click runs) and `icon-missing`. It is read at
 *   render, so names added to it later draw.
 * @param {{ size?: number|string, strokeWidth?: number, nonScalingStroke?: boolean }} [params.iconTheme]
 *   The app's `theme.icons` defaults.
 * @returns {Function} The Icon component.
 */
function createIcon({ icons, iconTheme = {} }) {
  function getIconData(name) {
    if (type.isString(name) && Object.hasOwn(icons, name)) {
      return icons[name];
    }
    return null;
  }

  function Icon({ events = {}, properties, styles = {}, testID }) {
    const { tokens } = useTheme();
    const iconProperties = type.isString(properties) ? { name: properties } : properties ?? {};
    const spin =
      (iconProperties.spin === true || events.onClick?.loading === true) &&
      iconProperties.disableLoadingIcon !== true;
    const rotation = useSpin(spin);
    const {
      color: elementColor,
      fontSize,
      ...elementStyle
    } = StyleSheet.flatten(styles.element) ?? {};
    const size =
      toPixels({
        fontSize: fontSize ?? tokens.fontSize,
        value: iconProperties.size ?? iconTheme.size ?? '1em',
      }) ??
      fontSize ??
      tokens.fontSize;
    const named = getIconData(iconProperties.name);
    let data = named;
    let color = iconProperties.color ?? elementColor ?? tokens.colorLabel;
    if (spin) {
      data = getIconData('loading');
    } else if (named === null) {
      data = getIconData('icon-missing');
      color = MISSING_COLOR;
    }
    const title = iconProperties.title ?? formatIconTitle(iconProperties.name);
    const accessibilityProps = title
      ? { accessible: true, accessibilityLabel: title, accessibilityRole: 'image' }
      : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
    let transform;
    if (spin) {
      transform = [{ rotate: rotation }];
    } else if (type.isNumber(iconProperties.rotate)) {
      transform = [{ rotate: `${iconProperties.rotate}deg` }];
    }
    return (
      <Animated.View
        {...accessibilityProps}
        style={[{ height: size, width: size }, elementStyle, transform && { transform }]}
        testID={testID}
      >
        <IconSvg
          color={color}
          data={data ?? EMPTY_ICON}
          nonScalingStroke={iconProperties.nonScalingStroke ?? iconTheme.nonScalingStroke ?? false}
          size={size}
          strokeWidth={iconProperties.strokeWidth ?? iconTheme.strokeWidth ?? 2}
        />
      </Animated.View>
    );
  }
  return Icon;
}

export default createIcon;
