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
import { Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import { GROUPED_INSET } from './ListRow.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import StatusMark from '../StatusIcon/StatusMark.js';

function getHeaderLayout({ first, grouped, headerVariant }) {
  if (!grouped) {
    return { paddingBottom: 6, paddingHorizontal: 16, paddingTop: 6 };
  }
  if (headerVariant === 'headline') {
    return { paddingBottom: 8, paddingHorizontal: GROUPED_INSET + 4, paddingTop: first ? 12 : 24 };
  }
  // Footnote headers line up with the cells' text, as iOS draws them.
  return { paddingBottom: 7, paddingHorizontal: GROUPED_INSET * 2, paddingTop: first ? 16 : 24 };
}

/**
 * A List section's header: an optional status glyph or stage dot, the title and a count, in iOS's
 * grouped style (Footnote, upper case, secondary) or as a Headline. A plain List's header has a
 * bar behind it, so it reads when it sticks to the top. An untitled section of a grouped List
 * keeps the space between sections.
 *
 * @param {Object} props
 * @param {Object} props.colors The List's semantic colours.
 * @param {boolean} props.first The List's first section.
 * @param {boolean} props.grouped
 * @param {'footnote'|'headline'} props.headerVariant
 * @param {Object} props.section A section from getSections.
 * @param {Object} [props.style] The List's `sectionHeader` style.
 * @param {Object} props.tokens
 */
function SectionHeader({ colors, first, grouped, headerVariant, section, style, tokens }) {
  const hasTitle = type.isString(section.title) && section.title !== '';
  const layout = getHeaderLayout({ first, grouped, headerVariant });
  if (!hasTitle && type.isNone(section.status)) {
    if (!grouped) return null;
    return <View style={{ height: layout.paddingTop }} />;
  }
  const headline = headerVariant === 'headline';
  const textStyle = headline
    ? { ...iosTextStyles.headline, color: colors.label }
    : { ...iosTextStyles.footnote, color: colors.secondaryLabel, textTransform: 'uppercase' };
  return (
    <View
      accessibilityRole="header"
      style={[
        layout,
        { alignItems: 'center', flexDirection: 'row', gap: 6 },
        grouped ? null : { backgroundColor: colors.groupedBackground },
        style,
      ]}
    >
      {type.isNone(section.status) ? null : (
        <StatusMark defaultSize={headline ? 16 : 13} status={section.status} tokens={tokens} />
      )}
      {hasTitle ? (
        <Text numberOfLines={1} style={[textStyle, { flexShrink: 1 }]}>
          {section.title}
        </Text>
      ) : null}
      {type.isNone(section.count) ? null : (
        <Text style={[textStyle, { color: colors.tertiaryLabel, fontVariant: ['tabular-nums'] }]}>
          {`${section.count}`}
        </Text>
      )}
    </View>
  );
}

export default SectionHeader;
