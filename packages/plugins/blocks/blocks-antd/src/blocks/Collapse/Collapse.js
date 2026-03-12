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
import { Collapse } from 'antd';
import { serializer, type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

import withTheme from '../withTheme.js';

const CollapseBlock = ({
  blockId,
  classNames = {},
  events,
  content,
  components: { Icon },
  methods,
  properties,
  styles = {},
}) => {
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
      variant={properties.bordered === false ? 'borderless' : properties.variant}
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
      expandIconPlacement={properties.expandIconPlacement}
      destroyInactivePanel={properties.destroyInactivePanel}
      className={classNames.element}
      classNames={{ header: classNames.header, content: classNames.content }}
      style={styles.element}
      styles={{ header: styles.header, content: styles.content }}
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

export default withTheme('Collapse', withBlockDefaults(CollapseBlock));
