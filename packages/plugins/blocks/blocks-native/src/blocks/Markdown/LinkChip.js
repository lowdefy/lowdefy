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

import React, { useContext } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import ChipWidthContext from './ChipWidthContext.js';
import getLinkChipColors from './getLinkChipColors.js';

const HEIGHT = 22;
// An inline view sits on the text's baseline; this lowers the chip so it centres on the line.
const BASELINE_SHIFT = Platform.select({ ios: 5, default: 3 });

/**
 * A link drawn as a chip inside the text: a pill with the chip's icon (or its prefix, as `@` on
 * a mention), the key in medium weight in the tone and the title after it, cut short to the
 * Markdown's width. It is pressable when the Markdown has a press handler for chips.
 *
 * @param {Object} props
 * @param {Object} props.chip The chip's config (one of `linkChips`).
 * @param {string} props.href
 * @param {Function} props.Icon The icon renderer (components.Icon).
 * @param {string} props.linkKey The key (getLinkChip).
 * @param {Function} [props.onPress] Called with the href.
 * @param {Object} props.palette The Markdown's palette (getMarkdownStyles).
 * @param {string|null} props.title
 */
function LinkChip({ chip, href, Icon, linkKey, onPress, palette, title }) {
  const maxWidth = useContext(ChipWidthContext);
  const colors = getLinkChipColors({ chip, isDark: palette.isDark, tokens: palette.tokens });
  const hasIcon = !type.isNone(chip.icon) && !type.isNone(Icon);
  const body = (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: HEIGHT / 2,
        flexDirection: 'row',
        gap: 4,
        height: HEIGHT,
        maxWidth,
        paddingLeft: hasIcon ? 6 : 8,
        paddingRight: 8,
      }}
    >
      {hasIcon ? (
        <Icon
          properties={chip.icon}
          styles={{ element: { color: colors.icon, fontSize: 14 } }}
          testID={`markdown-chip-icon-${linkKey}`}
        />
      ) : null}
      <Text
        ellipsizeMode="tail"
        numberOfLines={1}
        style={{ flexShrink: 1, fontSize: 15, letterSpacing: -0.24, lineHeight: 20 }}
      >
        <Text style={{ color: colors.key, fontVariant: ['tabular-nums'], fontWeight: '500' }}>
          {linkKey}
        </Text>
        {title === null ? null : <Text style={{ color: colors.title }}>{` ${title}`}</Text>}
      </Text>
    </View>
  );
  const label = title === null ? linkKey : `${linkKey} ${title}`;
  if (type.isNone(onPress)) {
    return (
      <View
        accessibilityLabel={label}
        style={{ transform: [{ translateY: BASELINE_SHIFT }] }}
        testID="markdown-chip"
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="link"
      hitSlop={{ bottom: 6, top: 6 }}
      onPress={() => onPress(href)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.55 : 1,
        transform: [{ translateY: BASELINE_SHIFT }],
      })}
      testID="markdown-chip"
    >
      {body}
    </Pressable>
  );
}

export default LinkChip;
