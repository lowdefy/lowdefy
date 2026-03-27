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

import React, { useCallback } from 'react';
import { Dropdown } from 'antd';
import { get } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';
import useItemShortcuts from '../useItemShortcuts.js';
import { buildMenuItems, flattenLinks } from '../buildMenuItems.js';

function collectLinkShortcuts(links) {
  const result = [];
  (links ?? []).forEach((link) => {
    if (link.type === 'MenuLink' || !link.type) {
      if (link.properties?.shortcut) {
        result.push({ key: link.id, shortcut: link.properties.shortcut });
      }
    }
    if (link.links) {
      result.push(...collectLinkShortcuts(link.links));
    }
  });
  return result;
}

function DropdownMenuBlock({
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge },
  content,
  events,
  methods,
  properties,
  rename,
  styles = {},
}) {
  const links = properties.links ?? [];

  const items = buildMenuItems({
    links,
    components: { Icon, Link, ShortcutBadge },
    classNames,
    styles,
    events,
  });

  const linkMap = flattenLinks(links);

  const shortcutItems = collectLinkShortcuts(links);
  const onShortcutMatch = useCallback(
    (key) => {
      const link = linkMap[key];
      methods.triggerEvent({
        name: get(rename, 'events.onClick', { default: 'onClick' }),
        event: { key, pageId: link?.pageId, url: link?.url },
      });
    },
    [methods, rename, linkMap]
  );
  useItemShortcuts({ items: shortcutItems, onMatch: onShortcutMatch });

  return (
    <Dropdown
      id={blockId}
      className={classNames.element}
      style={styles.element}
      menu={{
        items,
        onClick: ({ key, keyPath }) => {
          const link = linkMap[key];
          methods.triggerEvent({
            name: get(rename, 'events.onClick', { default: 'onClick' }),
            event: { key, keyPath, pageId: link?.pageId, url: link?.url },
          });
        },
        onSelect: ({ key, selectedKeys }) => {
          const link = linkMap[key];
          methods.triggerEvent({
            name: get(rename, 'events.onSelect', { default: 'onSelect' }),
            event: { key, selectedKeys, pageId: link?.pageId, url: link?.url },
          });
        },
        selectedKeys: properties.selectedKeys,
      }}
      trigger={[properties.trigger ?? 'hover']}
      placement={properties.placement}
      arrow={properties.arrow}
      disabled={properties.disabled}
      destroyOnHidden={properties.destroyOnClose}
      popupClassName={classNames.menu}
      popupStyle={styles.menu}
      onOpenChange={(open) =>
        methods.triggerEvent({
          name: get(rename, 'events.onOpenChange', { default: 'onOpenChange' }),
          event: { open },
        })
      }
    >
      <div>{content.content && content.content()}</div>
    </Dropdown>
  );
}

export default withTheme('Dropdown', withBlockDefaults(DropdownMenuBlock));
