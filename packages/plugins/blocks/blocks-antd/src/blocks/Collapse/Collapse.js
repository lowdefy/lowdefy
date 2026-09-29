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

// expandIconPosition is the pre-v5 name, with left and right values.
const legacyIconPlacements = { left: 'start', right: 'end' };

// Compact keeps the 16px inline inset of the panel header, so content stays aligned with it.
const bodyPadding = { compact: '8px 16px', none: 0 };

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
    properties.panels ??
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
      // Panels can come from a request that has not loaded yet.
      defaultActiveKey={properties.defaultActiveKey ?? panels[0]?.key}
      bordered={properties.bordered}
      accordion={properties.accordion}
      collapsible={properties.collapsible}
      ghost={properties.ghost}
      onChange={(activeKey) => methods.triggerEvent({ name: 'onChange', event: { activeKey } })}
      expandIcon={
        propertiesIconExpand &&
        (({ isActive }) => (
          <Icon
            blockId={`${blockId}_expandIcon`}
            classNames={{ element: classNames.expandIcon }}
            events={events}
            properties={{ rotate: isActive ? 90 : 0, ...propertiesIconExpand }}
            styles={{ element: styles.expandIcon }}
          />
        ))
      }
      expandIconPlacement={
        properties.expandIconPlacement ??
        legacyIconPlacements[properties.expandIconPosition] ??
        properties.expandIconPosition
      }
      destroyOnHidden={properties.destroyInactivePanel}
      size={properties.size}
      className={classNames.element}
      classNames={{ header: classNames.header, title: classNames.title, body: classNames.content }}
      style={styles.element}
      styles={{
        header: styles.header,
        title: styles.title,
        body: { padding: bodyPadding[properties.padding], ...styles.content },
      }}
      items={panels.map((panel) => ({
        key: panel.key,
        label: renderHtml({ html: panel.title, methods }),
        extra: content[panel.extraKey] && content[panel.extraKey](),
        collapsible: panel.disabled ? 'disabled' : undefined,
        forceRender: properties.forceRender,
        showArrow: properties.showArrow,
        children: content[panel.key] && content[panel.key](),
      }))}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...additionalProps}
    />
  );
};

export default withTheme('Collapse', withBlockDefaults(CollapseBlock));
