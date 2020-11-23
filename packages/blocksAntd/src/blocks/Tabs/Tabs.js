/*
  Copyright 2020 Lowdefy, Inc

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
import { Tabs } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

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

const TabsBlock = ({ blockId, content, methods, properties }) => {
  const tabs = getTabs({ content, properties });
  const additionalProps = getAdditionalProps({ content, properties });
  return (
    <Tabs
      animated={properties.animated !== undefined ? properties.animated : true}
      defaultActiveKey={properties.defaultActiveKey || tabs[0].key}
      id={blockId}
      onChange={(activeKey) => methods.callAction({ action: 'onChange', args: { activeKey } })}
      size={properties.size || 'default'}
      tabBarStyle={methods.makeCssClass(properties.tabBarStyle, { styleObjectOnly: true })}
      tabPosition={properties.tabPosition || 'top'}
      type={properties.tabType || 'line'}
      onTabScroll={({ direction }) =>
        methods.callAction({ action: 'onTabScroll', args: { direction } })
      }
      onTabClick={(key) => methods.callAction({ action: 'onTabClick', args: { key } })}
      {...additionalProps}
    >
      {tabs.map((tab, i) => (
        <Tabs.TabPane
          disabled={tab.disabled}
          key={tab.key}
          tab={
            <span className={methods.makeCssClass(tab.titleStyle)}>
              {tab.icon && (
                <Icon blockId={`${blockId}_icon`} methods={methods} properties={tab.icon} />
              )}
              {tab.title || tab.key}
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

export default TabsBlock;
