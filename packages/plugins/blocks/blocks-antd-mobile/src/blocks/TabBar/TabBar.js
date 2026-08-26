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
import { TabBar } from 'antd-mobile';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

function getMenuLinks(menus, menuId) {
  if (!type.isArray(menus)) return [];
  const menu = menus.find((item) => item.menuId === (menuId ?? 'default')) ?? menus[0] ?? {};
  // TabBar is flat — only top-level MenuLinks render as tabs.
  return (menu.links ?? []).filter((link) => link.type === 'MenuLink');
}

function TabBarBlock({
  blockId,
  classNames = {},
  components: { Icon },
  menus,
  methods,
  pageId,
  properties,
  styles = {},
}) {
  const links = getMenuLinks(menus, properties.menuId);
  return (
    <div id={blockId} className={classNames.element} style={styles.element}>
      <TabBar
        activeKey={pageId}
        safeArea={properties.safeArea !== false}
        onChange={(key) => {
          methods.triggerEvent({ name: 'onChange', event: { pageId: key } });
          const link = links.find((item) => (item.pageId ?? item.menuItemId) === key);
          if (link) {
            methods.link({
              pageId: link.pageId,
              url: link.url,
              urlQuery: link.urlQuery,
              input: link.input,
            });
          }
        }}
      >
        {links.map((link) => (
          <TabBar.Item
            key={link.pageId ?? link.menuItemId}
            title={link.properties?.title ?? link.pageId ?? link.menuItemId}
            icon={
              link.properties?.icon && (
                <Icon
                  blockId={`${blockId}_icon_${link.menuItemId}`}
                  properties={link.properties.icon}
                />
              )
            }
          />
        ))}
      </TabBar>
    </div>
  );
}

export default withBlockDefaults(TabBarBlock);
