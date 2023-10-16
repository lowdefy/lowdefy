/*
  Copyright 2020-2023 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Tabs } from 'antd';

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

const getAdditionalProps = ({ content, properties }) => {
  const additionalProps = {};
  if (properties.activeKey) {
    additionalProps.activeKey = properties.activeKey;
  }
  if (properties.extraAreaKey) {
    additionalProps.tabBarExtraContent =
      content[properties.extraAreaKey] && content[properties.extraAreaKey]();
  }
  return additionalProps;
};

const TabsBlock = ({ blockId, components: { Icon }, events, content, methods, properties }) => {
  const tabs = getTabs({ content, properties });
  const additionalProps = getAdditionalProps({ content, properties });
  return (
    <Tabs
      animated={properties.animated !== undefined ? properties.animated : true}
      defaultActiveKey={properties.defaultActiveKey ?? tabs[0].key}
      id={blockId}
      onChange={(activeKey) => methods.triggerEvent({ name: 'onChange', event: { activeKey } })}
      size={properties.size ?? 'default'}
      tabBarStyle={methods.makeCssClass(properties.tabBarStyle, true)}
      tabPosition={properties.tabPosition ?? 'top'}
      type={properties.tabType ?? 'line'}
      onTabScroll={({ direction }) =>
        methods.triggerEvent({ name: 'onTabScroll', event: { direction } })
      }
      onTabClick={(key) => methods.triggerEvent({ name: 'onTabClick', event: { key } })}
      {...additionalProps}
    >
      {tabs.map((tab) => (
        <Tabs.TabPane
          disabled={tab.disabled}
          key={tab.key}
          tab={
            <span className={methods.makeCssClass(tab.titleStyle)}>
              {tab.icon && (
                <Icon blockId={`${blockId}_icon`} events={events} properties={tab.icon} />
              )}
              {tab.title ?? tab.key}
            </span>
          }
        >
          {content[tab.key] && content[tab.key]()}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

TabsBlock.defaultProps = blockDefaultProps;
TabsBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Tabs/style.less'],
};

export default TabsBlock;
