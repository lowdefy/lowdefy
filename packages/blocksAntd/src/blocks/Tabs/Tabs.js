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

const TabsBlock = ({ blockId, content, methods, properties }) => {
  const tabs = (
    properties.tabs ||
    Object.keys(content)
      .sort()
      .map((key) => ({ key, title: key }))
  ).filter((tab) => tab.key !== 'tabBarExtraContent');
  const additionalProps = {};
  if (properties.activeKey) {
    additionalProps.activeKey = properties.activeKey;
  }
  return (
    <Tabs
      id={blockId}
      defaultActiveKey={properties.defaultActiveKey || tabs[0].key}
      animated={properties.animated !== undefined ? properties.animated : true}
      size={properties.size || 'default'}
      tabPosition={properties.tabPosition || 'top'}
      type={properties.tabType || 'line'}
      onChange={(activeKey) => methods.callAction({ action: 'onChange', args: { activeKey } })}
      onTabScroll={({ direction }) =>
        methods.callAction({ action: 'onTabScroll', args: { direction } })
      }
      onTabClick={(key) => methods.callAction({ action: 'onTabClick', args: { key } })}
      tabBarExtraContent={content.extra && content.extra()}
      tabBarStyle={methods.makeCssClass(properties.tabBarStyle, { styleObjectOnly: true })}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...additionalProps}
    >
      {tabs.map((tab, i) => (
        <Tabs.TabPane
          disabled={tab.disabled}
          tab={
            tab.icon ? (
              <span className={methods.makeCssClass(tab.titleStyle)}>
                <Icon blockId={`${blockId}_icon`} methods={methods} properties={tab.icon} />
                {tab.title || tab.key}
              </span>
            ) : (
              <span className={methods.makeCssClass(tab.titleStyle)}>{tab.title || tab.key}</span>
            )
          }
          key={tab.key}
        >
          {content[tab.key] && content[tab.key]()}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

TabsBlock.defaultProps = blockDefaultProps;

export default TabsBlock;
