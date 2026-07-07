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
import { List } from 'antd-mobile';
import { withBlockDefaults } from '@lowdefy/block-utils';

// Item property mapping (design open question 2, settled here): per-item data
// (title, description, avatars, ...) is authored as blocks inside the repeated
// content area — the standard Lowdefy list idiom — so no per-item property map
// exists. Block-level properties cover the List.Item chrome that cannot be
// authored as content: `itemArrow` (link arrow on every item) and the
// `onItemClick` event, which fires with { index } so actions can read the
// clicked item from state.
function ListBlock({ classNames = {}, events, list, methods, properties, styles = {} }) {
  useEffect(() => {
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
  }, []);
  const clickable = Boolean(events.onItemClick);
  return (
    <List
      className={classNames.element}
      style={styles.element}
      header={properties.header}
      mode={properties.mode}
    >
      {list.map((item, index) => (
        <List.Item
          key={index}
          arrow={properties.itemArrow}
          className={classNames.item}
          style={styles.item}
          clickable={clickable}
          onClick={
            clickable
              ? () => methods.triggerEvent({ name: 'onItemClick', event: { index } })
              : undefined
          }
        >
          {item.content && item.content()}
        </List.Item>
      ))}
    </List>
  );
}

export default withBlockDefaults(ListBlock);
