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
import { get } from '@lowdefy/helpers';
import { List, Typography } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import Button from '../Button/Button.js';
import withTheme from '../withTheme.js';

const ControlledListBlock = ({
  blockId,
  classNames = {},
  components: { Icon, Link },
  events,
  list,
  methods,
  properties,
  styles = {},
}) => {
  useEffect(() => {
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
  });
  if (list.length < (properties.minItems ?? 0)) {
    for (let i = 0; i < (properties.minItems ?? 0) - list.length; i++) {
      methods.pushItem({});
    }
  }
  return (
    <List
      id={blockId}
      className={classNames.element}
      size={properties.size}
      style={styles.element}
      header={
        (properties.title || (properties.addToFront && !properties.hideAddButton)) && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'space-between',
              ...styles.header,
            }}
          >
            {properties.title ? (
              <Typography.Text strong>{properties.title}</Typography.Text>
            ) : (
              <br />
            )}
            {properties.addToFront && !properties.hideAddButton && (
              <Button
                blockId={`${blockId}_add_button`}
                components={{ Icon, Link }}
                events={events}
                properties={{
                  icon: 'AiOutlinePlus',
                  size: properties.size,
                  title: get(properties, 'addItemButton.title ') ?? 'Add Item',
                  type: 'default',
                  ...properties.addItemButton,
                }}
                onClick={() => methods.unshiftItem()}
              />
            )}
          </div>
        )
      }
      footer={
        !properties.addToFront &&
        !properties.hideAddButton && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'space-between',
              ...styles.footer,
            }}
          >
            <br />
            <Button
              blockId={`${blockId}_add_button`}
              components={{ Icon, Link }}
              events={events}
              properties={{
                icon: 'AiOutlinePlus',
                size: properties.size,
                title: get(properties, 'addItemButton.title ') ?? 'Add Item',
                type: 'dashed',
                ...properties.addItemButton,
              }}
              onClick={() => methods.pushItem()}
            />
          </div>
        )
      }
      bordered
      locale={{ emptyText: properties.noDataTitle ?? 'No Items' }}
      dataSource={list}
      renderItem={(item, i) => (
        <List.Item
          key={`${blockId}_${i}`}
          style={{ width: '100%', ...styles.item }}
          extra={
            !properties.hideRemoveButton &&
            list.length > (properties.minItems ?? 0) && [
              // eslint-disable-next-line react/jsx-key
              <Icon
                blockId={`${blockId}_${i}_remove_icon`}
                events={events}
                properties={{
                  name: 'AiOutlineMinusCircle',
                  ...properties.removeItemIcon,
                  style: {
                    paddingLeft:
                      properties.size === 'small' ? 2 : properties.size === 'large' ? 6 : 4,
                    fontSize:
                      properties.size === 'small' ? 16 : properties.size === 'large' ? 20 : 18,
                    ...(properties.removeItemIcon?.style ? properties.removeItemIcon.style : {}),
                  },
                }}
                onClick={() => methods.removeItem(i)}
              />,
            ]
          }
        >
          {item.content && item.content({ width: '100%' })}
        </List.Item>
      )}
    />
  );
};

export default withTheme('List', withBlockDefaults(ControlledListBlock));
