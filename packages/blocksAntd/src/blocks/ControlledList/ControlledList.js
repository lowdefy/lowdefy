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

import React, { useEffect } from 'react';
import { get } from '@lowdefy/helpers';
import { List, Typography } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Button from '../Button/Button';

const ControlledListBlock = ({ blockId, properties, list, methods }) => {
  useEffect(() => {
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
  }, []);
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
                properties={{
                  title: get(properties, 'addItemButton.title ') || 'Add Item',
                  size: properties.size,
                  type: 'primary',
                  icon: 'PlusOutlined',
                  ...properties.addItemButton,
                }}
                methods={methods}
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
              properties={{
                title: get(properties, 'addItemButton.title ') || 'Add Item',
                type: 'primary',
                size: properties.size,
                icon: 'PlusOutlined',
                ...properties.addItemButton,
              }}
              methods={methods}
              onClick={() => methods.pushItem()}
            />
          </div>
        )
      }
      bordered
      locale={{ emptyText: properties.noDataTitle || 'No Items' }}
      dataSource={list}
      renderItem={(item, i) => (
        <List.Item
          key={`${blockId}_${i}`}
          className={methods.makeCssClass([styles.item, properties.itemStyle])}
          actions={
            !properties.hideRemoveButton && [
              <Button
                blockId={`${blockId}_${i}_remove_button`}
                properties={{
                  title: '',
                  type: 'danger',
                  shape: 'circle',
                  size: 'small',
                  icon: { name: 'DeleteOutlined' },
                  ...properties.removeItemButton,
                }}
                methods={methods}
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

export default ControlledListBlock;
