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

import React, { useEffect } from 'react';
import { get } from '@lowdefy/helpers';
import { List, Typography } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Button from '../Button/Button.js';

const ControlledListBlock = ({
  blockId,
  components: { Icon, Link },
  events,
  list,
  methods,
  properties,
}) => {
  useEffect(() => {
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
  });
  const styles = {
    header: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
    },
    footer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
    },
    item: {
      width: '100%',
    },
  };
  return (
    <List
      id={blockId}
      size={properties.size}
      header={
        (properties.title || (properties.addToFront && !properties.hideAddButton)) && (
          <div className={methods.makeCssClass([styles.header, properties.headerStyle])}>
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
          <div className={methods.makeCssClass([styles.footer, properties.footerStyle])}>
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
          className={methods.makeCssClass([styles.item, properties.itemStyle])}
          extra={
            !properties.hideRemoveButton && [
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

ControlledListBlock.defaultProps = blockDefaultProps;
ControlledListBlock.meta = {
  valueType: 'array',
  category: 'list',
  icons: ['AiOutlinePlus', 'AiOutlineMinusCircle'],
  styles: ['blocks/ControlledList/style.less'],
};

export default ControlledListBlock;
