/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { Collapse } from 'antd';
import { serializer, type } from '@lowdefy/helpers';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

const CollapseBlock = ({ blockId, events, content, components: { Icon }, methods, properties }) => {
  const panels =
    properties.panels ||
    Object.keys(content)
      .sort()
      .map((key) => ({ key, title: key }));
  const additionalProps = {};
  if (properties.activeKey) {
    additionalProps.activeKey = properties.activeKey;
  }
  let propertiesIconExpand = serializer.copy(properties.expandIcon);
  if (type.isString(propertiesIconExpand)) {
    propertiesIconExpand = { name: propertiesIconExpand };
  }
  return (
    <Collapse
      id={blockId}
      defaultActiveKey={properties.defaultActiveKey || panels[0].key}
      bordered={properties.bordered}
      accordion={properties.accordion}
      onChange={(activeKey) => methods.triggerEvent({ name: 'onChange', event: { activeKey } })}
      expandIcon={
        propertiesIconExpand &&
        (({ isActive }) => (
          <Icon
            blockId={`${blockId}_expandIcon`}
            events={events}
            properties={{ rotate: isActive ? 90 : 0, ...propertiesIconExpand }}
          />
        ))
      }
      expandIconPosition={properties.expandIconPosition}
      destroyInactivePanel={properties.destroyInactivePanel}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...additionalProps}
    >
      {panels.map((panel) => (
        <Collapse.Panel
          extra={content[panel.extraKey] && content[panel.extraKey]()}
          collapsible={panel.disabled && 'disabled'}
          forceRender={properties.forceRender}
          header={renderHtml({ html: panel.title, methods })}
          key={panel.key}
          showArrow={properties.showArrow}
        >
          {content[panel.key] && content[panel.key]()}
        </Collapse.Panel>
      ))}
    </Collapse>
  );
};

CollapseBlock.defaultProps = blockDefaultProps;
CollapseBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Collapse/style.less'],
};

export default CollapseBlock;
