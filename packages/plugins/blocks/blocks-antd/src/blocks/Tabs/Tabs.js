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

import React, { useState, useEffect, useCallback } from 'react';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { Tabs } from 'antd';

import withTheme from '../withTheme.js';
import useItemShortcuts from '../useItemShortcuts.js';

const getTabs = ({ content, properties }) => {
  let tabs = properties.tabs;
  if (!tabs) {
    tabs = Object.keys(content)
      .sort()
      .map((key) => ({ key, title: key }));
  }
  // remove extraAreaKey key area from tabs
  return tabs.filter((tab) => tab.key !== properties.extraAreaKey);
};

function TabsBlock({
  blockId,
  classNames = {},
  components: { Icon, ShortcutBadge },
  events,
  content,
  methods,
  properties,
  styles = {},
}) {
  const tabs = getTabs({ content, properties });
  const additionalProps = {};
  if (properties.extraAreaKey) {
    additionalProps.tabBarExtraContent =
      content[properties.extraAreaKey] && content[properties.extraAreaKey]();
  }

  const [key, setKey] = useState(properties.defaultActiveKey ?? tabs[0].key);
  useEffect(() => {
    methods.registerMethod('setActiveKey', ({ activeKey }) => {
      if (activeKey !== key) {
        setKey(activeKey);
        methods.triggerEvent({ name: 'onChange', event: { activeKey } });
      }
    });
  });

  const shortcutItems = tabs
    .filter((tab) => tab.shortcut)
    .map((tab) => ({ key: tab.key, shortcut: tab.shortcut, disabled: tab.disabled }));
  const onShortcutMatch = useCallback(
    (activeKey) => {
      setKey(activeKey);
      methods.triggerEvent({ name: 'onChange', event: { activeKey } });
    },
    [methods]
  );
  useItemShortcuts({ items: shortcutItems, onMatch: onShortcutMatch });

  return (
    <Tabs
      activeKey={key}
      animated={properties.animated !== undefined ? properties.animated : true}
      id={blockId}
      onChange={(activeKey) => {
        setKey(activeKey);
        methods.triggerEvent({ name: 'onChange', event: { activeKey } });
      }}
      size={properties.size ?? 'default'}
      tabPlacement={properties.tabPlacement ?? 'top'}
      type={properties.tabType ?? 'line'}
      onTabScroll={({ direction }) =>
        methods.triggerEvent({ name: 'onTabScroll', event: { direction } })
      }
      onTabClick={(key) => {
        methods.triggerEvent({ name: 'onTabClick', event: { key } });
      }}
      className={classNames.element}
      classNames={{
        tabBar: classNames.tabBar,
        tabPane: classNames.tabPane,
        inkBar: classNames.inkBar,
      }}
      style={styles.element}
      styles={{ tabBar: styles.tabBar }}
      items={tabs.map((tab) => ({
        id: `${blockId}_${tab.key}`,
        key: tab.key,
        disabled: tab.disabled,
        label: (
          <span style={tab.titleStyle}>
            {tab.icon && (
              <Icon
                blockId={`${blockId}_icon`}
                classNames={{ element: classNames.icon }}
                events={events}
                properties={tab.icon}
                styles={{ element: styles.icon }}
              />
            )}
            {tab.title ? renderHtml({ html: tab.title, methods }) : tab.key}
            <ShortcutBadge shortcut={tab.shortcut} />
          </span>
        ),
        children: content[tab.key] && content[tab.key](),
      }))}
      {...additionalProps}
    />
  );
}

export default withTheme('Tabs', withBlockDefaults(TabsBlock));
