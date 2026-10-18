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

import React, { useEffect } from 'react';
import { FlatList, SectionList, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import getSections from './getSections.js';
import getSemanticColors from '../../shared/getSemanticColors.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import ListRow, { GROUPED_INSET } from './ListRow.js';
import meta from './meta.js';
import SectionHeader from './SectionHeader.js';
import SwipeableRow from '../../shared/SwipeableRow.js';
import useComponentTokens from '../../useComponentTokens.js';

// The List's own swipe actions fire a List event, named by `event`, with the item index.
function toRowAction(action) {
  return {
    ...action,
    id: action.event,
    tone: action.tone ?? (action.danger === true ? 'danger' : undefined),
  };
}

/**
 * The web List's model on a phone: an array in state at the block id, the `content` slot drawn
 * once per item, and the pushItem, unshiftItem, removeItem, moveItemUp and moveItemDown methods.
 *
 * It draws as iOS lists do. `insetGrouped` (the default) draws each section as a rounded group
 * of cells inset from the screen edges on the grouped background; `plain` draws edge to edge
 * rows with sticky section headers. Sections come from `header` (one section) or from
 * `sectionKey` and `sections` (one per key). A row's separator is inset to a ListItem's text.
 *
 * The List lays out inside the page's scroll view, so it scrolls itself only with `scroll: true`
 * (give it a height); pull to refresh (`onRefresh`) and sticky headers need a List that scrolls
 * itself.
 */
function List({ blockId, components, events, list, methods, properties, styles, value }) {
  const { tokens } = useComponentTokens(properties.theme);
  const colors = getSemanticColors({ tokens });
  useEffect(() => {
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
    // Registered once, as the web List does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const direction = properties.direction ?? 'column';
  const horizontal = direction.startsWith('row');
  const grouped = !horizontal && (properties.variant ?? 'insetGrouped') === 'insetGrouped';
  const background = grouped ? colors.cell : colors.background;
  const swipeActions = (properties.swipeActions ?? []).map(toRowAction);

  function renderContent(index) {
    const itemTestID = `${blockId}_${index}`;
    const content = <View testID={itemTestID}>{list[index].content()}</View>;
    if (swipeActions.length === 0) {
      return content;
    }
    return (
      <SwipeableRow
        background={background}
        Icon={components.Icon}
        onAction={(action) => methods.triggerEvent({ name: action.event, event: { index } })}
        testID={itemTestID}
        tokens={tokens}
        trailing={swipeActions}
      >
        {content}
      </SwipeableRow>
    );
  }

  const listProps = {
    horizontal,
    inverted: direction.endsWith('-reverse'),
    keyExtractor: (index) => `${index}`,
    onRefresh: type.isNone(events.onRefresh)
      ? undefined
      : () => methods.triggerEvent({ name: 'onRefresh' }),
    refreshing: events.onRefresh?.loading === true,
    scrollEnabled: properties.scroll === true,
    testID: `${blockId}_list`,
  };
  if (horizontal) {
    return (
      <FlatList
        {...listProps}
        data={list.map((item, index) => index)}
        renderItem={({ item: index }) => renderContent(index)}
        style={styles.element}
      />
    );
  }
  const sections = getSections({
    count: list.length,
    header: properties.header,
    sectionKey: properties.sectionKey,
    sections: properties.sections,
    showCount: properties.showCount,
    value,
  });
  const headerVariant = properties.headerVariant ?? (grouped ? 'footnote' : 'headline');
  return (
    <SectionList
      {...listProps}
      contentContainerStyle={grouped ? { paddingBottom: GROUPED_INSET } : undefined}
      renderItem={({ item: index, index: position, section }) => (
        <ListRow
          background={background}
          first={position === 0}
          grouped={grouped}
          last={position === section.data.length - 1}
          separatorColor={colors.separator}
          style={styles.cell}
        >
          {renderContent(index)}
        </ListRow>
      )}
      renderSectionFooter={({ section }) =>
        type.isString(section.footer) ? (
          <Text
            style={[
              iosTextStyles.footnote,
              {
                color: colors.secondaryLabel,
                paddingHorizontal: grouped ? GROUPED_INSET * 2 : GROUPED_INSET,
                paddingTop: 7,
              },
              styles.sectionFooter,
            ]}
          >
            {section.footer}
          </Text>
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <SectionHeader
          colors={colors}
          first={section === sections[0]}
          grouped={grouped}
          headerVariant={headerVariant}
          section={section}
          style={styles.sectionHeader}
          tokens={tokens}
        />
      )}
      sections={sections}
      stickySectionHeadersEnabled={properties.stickyHeaders ?? !grouped}
      style={[grouped ? { backgroundColor: colors.groupedBackground } : null, styles.element]}
    />
  );
}

List.meta = meta;

export default List;
