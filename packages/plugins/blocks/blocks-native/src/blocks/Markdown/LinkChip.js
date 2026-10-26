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
import getChipMaxWidth from './getChipMaxWidth.js';
import getLinkChipColors from './getLinkChipColors.js';

const HEIGHT = 22;
// An inline view sits on the text's baseline; this lowers the chip so it centres on the line.
// Body text (17pt on a 22pt line) drawn in the chip's 22pt row then sits on the line's baseline.
const BASELINE_SHIFT = Platform.select({ ios: 5, default: 3 });

/**
 * A link drawn as a chip inside the text: a pill with the chip's icon (or its prefix, as `@` on
 * a mention), the key in medium weight in the tone and the title after it. It is pressable when
 * the Markdown has a press handler for chips.
 *
 * The chip lays out as a word of the text: it is as wide as its content, at most the line's
 * width, or three quarters of it when text follows (getChipMaxWidth); past that the title is cut
 * short with an ellipsis and the key never is. Closing punctuation after the link is drawn inside
 * the chip's inline view (layoutLinkChips), so the two wrap together and a line never starts
 * with it; a chip that does not fit on a line moves to the next one whole.
 *
 * @param {Object} props
 * @param {Object} props.chip The chip's config (one of `linkChips`).
 * @param {boolean} [props.followed] Text follows the chip on its line (layoutLinkChips).
 * @param {string} props.href
 * @param {Function} props.Icon The icon renderer (components.Icon).
 * @param {string} props.linkKey The key (getLinkChip).
 * @param {Function} [props.onPress] Called with the href.
 * @param {Object} props.palette The Markdown's palette (getMarkdownStyles).
 * @param {string|null} props.title
 * @param {{ style: Object[], text: string }} [props.trailing] Punctuation drawn after the chip,
 *   in the styles of the text it came from (layoutLinkChips).
 */
function LinkChip({
  chip,
  followed = false,
  href,
  Icon,
  linkKey,
  onPress,
  palette,
  title,
  trailing = null,
}) {
  const width = useContext(ChipWidthContext);
  const colors = getLinkChipColors({ chip, isDark: palette.isDark, tokens: palette.tokens });
  const hasIcon = !type.isNone(chip.icon) && !type.isNone(Icon);
  const label = title === null ? linkKey : `${linkKey} ${title}`;
  const textStyle = { fontSize: 15, letterSpacing: -0.24, lineHeight: 20 };
  const pillStyle = {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: HEIGHT / 2,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
    height: HEIGHT,
    minWidth: 0,
    paddingLeft: hasIcon ? 6 : 8,
    paddingRight: 8,
  };
  const content = (
    <>
      {hasIcon ? (
        <Icon
          properties={chip.icon}
          styles={{ element: { color: colors.icon, fontSize: 14 } }}
          testID={`markdown-chip-icon-${linkKey}`}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          ...textStyle,
          color: colors.key,
          flexShrink: 0,
          fontVariant: ['tabular-nums'],
          fontWeight: '500',
        }}
      >
        {linkKey}
      </Text>
      {title === null ? null : (
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{ ...textStyle, color: colors.title, flexShrink: 1, minWidth: 0 }}
        >
          {title}
        </Text>
      )}
    </>
  );
  const pill = type.isNone(onPress) ? (
    <View accessibilityLabel={label} style={pillStyle} testID="markdown-chip">
      {content}
    </View>
  ) : (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="link"
      hitSlop={{ bottom: 6, top: 6 }}
      onPress={() => onPress(href)}
      style={({ pressed }) => [pillStyle, { opacity: pressed ? 0.55 : 1 }]}
      testID="markdown-chip"
    >
      {content}
    </Pressable>
  );
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        maxWidth: getChipMaxWidth({ followed, width }),
        transform: [{ translateY: BASELINE_SHIFT }],
      }}
      testID="markdown-chip-inline"
    >
      {pill}
      {trailing === null ? null : (
        <Text style={[...trailing.style, { flexShrink: 0 }]} testID="markdown-chip-trailing">
          {trailing.text}
        </Text>
      )}
    </View>
  );
}

export default LinkChip;
