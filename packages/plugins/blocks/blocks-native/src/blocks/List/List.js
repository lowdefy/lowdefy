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
import meta from './meta.js';
import SwipeableRow from './SwipeableRow.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

/**
 * The web List's model on a phone: an array in state at the block id, the `content` slot drawn
 * once per item, and the pushItem, unshiftItem, removeItem, moveItemUp and moveItemDown methods.
 * Items render in a virtualised FlatList, or a SectionList with sticky headers when `sectionKey`
 * is set.
 *
 * The List lays out inside the page's scroll view, so it scrolls itself only with `scroll: true`
 * (give it a height); pull to refresh (`onRefresh`) needs a List that scrolls itself.
 */
function List({ blockId, events, list, methods, properties, styles, value }) {
  const { tokens } = useBlockTokens({ properties });
  useEffect(() => {
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
    // Registered once, as the web List does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const swipeActions = properties.swipeActions ?? [];
  const renderItem = ({ item: index }) => {
    const itemTestID = `${blockId}_${index}`;
    const content = <View testID={itemTestID}>{list[index].content()}</View>;
    if (swipeActions.length === 0) {
      return content;
    }
    return (
      <SwipeableRow
        actions={swipeActions}
        onAction={(action) => methods.triggerEvent({ name: action.event, event: { index } })}
        testID={itemTestID}
        tokens={tokens}
      >
        {content}
      </SwipeableRow>
    );
  };
  const direction = properties.direction ?? 'column';
  const listProps = {
    horizontal: direction.startsWith('row'),
    inverted: direction.endsWith('-reverse'),
    keyExtractor: (index) => `${index}`,
    onRefresh: type.isNone(events.onRefresh)
      ? undefined
      : () => methods.triggerEvent({ name: 'onRefresh' }),
    refreshing: events.onRefresh?.loading === true,
    renderItem,
    scrollEnabled: properties.scroll === true,
    style: styles.element,
    testID: `${blockId}_list`,
  };
  if (type.isString(properties.sectionKey)) {
    return (
      <SectionList
        {...listProps}
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={[
              {
                backgroundColor: tokens.colorBgLayout,
                color: tokens.colorTextSecondary,
                fontSize: tokens.fontSize,
                fontWeight: `${tokens.fontWeightStrong}`,
                paddingHorizontal: tokens.padding,
                paddingVertical: tokens.paddingXXS,
              },
              styles.sectionHeader,
            ]}
          >
            {section.title}
          </Text>
        )}
        sections={getSections({ count: list.length, sectionKey: properties.sectionKey, value })}
        stickySectionHeadersEnabled
      />
    );
  }
  return <FlatList {...listProps} data={list.map((item, index) => index)} />;
}

List.meta = meta;

export default List;
