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

import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import iosTextStyles from '../../shared/iosTextStyles.js';

const HEIGHT = 32;
const TILE = 20;
const TILE_ICON = 13;
const PLAIN_ICON = 16;
const PRESSED_SCALE = 0.97;

const labelStyle = { ...iosTextStyles.subheadline, fontWeight: '600' };

function iconProperties(icon) {
  return { ...(type.isString(icon) ? { name: icon } : icon), title: '' };
}

// The chip's scale: down to 0.97 while pressed, back with a little spring on release.
function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  return {
    scale,
    onPressIn: () =>
      Animated.timing(scale, {
        duration: 90,
        toValue: PRESSED_SCALE,
        useNativeDriver: true,
      }).start(),
    onPressOut: () =>
      Animated.spring(scale, {
        bounciness: 6,
        speed: 24,
        toValue: 1,
        useNativeDriver: true,
      }).start(),
  };
}

// The option's icon: in a rounded-square tile of its colour, or (the more chip) drawn plain.
function ChipIcon({ components, icon, tile }) {
  if (tile === null) {
    return (
      <components.Icon
        properties={iconProperties(icon.name)}
        styles={{ element: { color: icon.color, fontSize: PLAIN_ICON } }}
      />
    );
  }
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: tile.background,
        borderRadius: 6,
        height: TILE,
        justifyContent: 'center',
        width: TILE,
      }}
    >
      <components.Icon
        properties={iconProperties(icon.name)}
        styles={{ element: { color: tile.foreground, fontSize: TILE_ICON } }}
      />
    </View>
  );
}

/**
 * One chip of a ChipSelector: a 32pt capsule holding the option's icon tile, its label in
 * Subheadline semibold and an optional badge. Unselected it sits on the system fill in the label
 * colour; selected it fills with its colour's tint, with a 1pt border and label of the colour. It
 * scales to 0.97 while pressed. The more chip passes no tile: its icon is drawn plain.
 *
 * @param {Object} props
 * @param {string} props.accessibilityLabel
 * @param {Object} props.colors `{ background, border, label, badge }`.
 * @param {Object} props.components The block's components, for the icon renderer.
 * @param {boolean} props.disabled
 * @param {{ name: string|Object, color?: string }} [props.icon] The icon and, drawn plain, its colour.
 * @param {string} [props.label]
 * @param {string|number} [props.badge]
 * @param {(event: Object) => void} props.onLayout
 * @param {() => void} props.onPress
 * @param {boolean} props.selected
 * @param {Object} [props.styles] The block's `chip` and `label` styles.
 * @param {string} props.testID
 * @param {Object|null} [props.tile] `{ background, foreground }` of the icon tile, or null.
 */
function Chip({
  accessibilityLabel,
  badge,
  colors,
  components,
  disabled,
  icon,
  label,
  onLayout,
  onPress,
  selected,
  styles = {},
  testID,
  tile = null,
}) {
  const { onPressIn, onPressOut, scale } = usePressScale();
  const hasIcon = !type.isNone(icon?.name);
  const hasLabel = type.isString(label) && label !== '';
  let paddingLeft = 12;
  if (hasIcon) paddingLeft = tile === null ? 10 : 5;
  return (
    <Animated.View onLayout={onLayout} style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          {
            alignItems: 'center',
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderCurve: 'continuous',
            borderRadius: HEIGHT / 2,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 6,
            height: HEIGHT,
            justifyContent: 'center',
            minWidth: HEIGHT,
            opacity: disabled ? 0.4 : 1,
            paddingLeft: hasLabel ? paddingLeft : 0,
            paddingRight: hasLabel ? 12 : 0,
          },
          styles.chip,
        ]}
        testID={testID}
      >
        {hasIcon ? <ChipIcon components={components} icon={icon} tile={tile} /> : null}
        {hasLabel ? (
          <Text numberOfLines={1} style={[labelStyle, { color: colors.label }, styles.label]}>
            {label}
          </Text>
        ) : null}
        {type.isNone(badge) ? null : (
          <Text
            style={[
              iosTextStyles.footnote,
              { color: colors.badge, fontVariant: ['tabular-nums'], fontWeight: '600' },
            ]}
          >
            {`${badge}`}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default Chip;
