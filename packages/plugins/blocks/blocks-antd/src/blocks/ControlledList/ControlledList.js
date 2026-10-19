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

import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { ConfigProvider, Empty, Typography } from 'antd';
import classnames from 'classnames';
import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import { get } from '@lowdefy/helpers';

import Button from '../Button/Button.js';
import withTheme from '../withTheme.js';
import getListThemeStyle from './getListThemeStyle.js';

import './style.css';

const sizeClassNames = {
  large: 'ant-list-lg',
  small: 'ant-list-sm',
};

// Renders antd List's markup and class names itself: antd 6.6 deprecates List, and style.css
// carries the List styles the block uses, so existing app CSS and tests keep matching.
const ControlledListBlock = ({
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge },
  events,
  list,
  methods,
  properties,
  styles = {},
  value = [],
}) => {
  // withTheme puts the block theme on a ConfigProvider, merged there with the app's List tokens.
  const { direction, theme } = useContext(ConfigProvider.ConfigContext);
  const { componentDisabled, componentSize } = ConfigProvider.useConfig();
  useEffect(() => {
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
  });
  const minItems = properties.minItems ?? 0;
  // Pushing items updates page state, so it can't run during render. A layout effect re-renders
  // with the new items before the browser paints, so the short list never shows.
  useLayoutEffect(() => {
    for (let i = list.length; i < minItems; i++) {
      methods.pushItem({});
    }
  }, [list.length, minItems]);

  const addItemToFront = () => {
    methods.unshiftItem();
    methods.triggerEvent({ name: 'onAdd', event: { index: 0, item: undefined } });
  };
  const addItemToBack = () => {
    const index = value.length;
    methods.pushItem();
    methods.triggerEvent({ name: 'onAdd', event: { index, item: undefined } });
  };
  const removeItemAt = (index) => {
    const item = value[index];
    methods.removeItem(index);
    methods.triggerEvent({ name: 'onRemove', event: { index, item } });
  };
  const header = (properties.title || (properties.addToFront && !properties.hideAddButton)) && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
        ...styles.header,
      }}
    >
      {properties.title ? <Typography.Text strong>{properties.title}</Typography.Text> : <br />}
      {properties.addToFront && !properties.hideAddButton && (
        <Button
          blockId={`${blockId}_add_button`}
          components={{ Icon, Link, ShortcutBadge }}
          events={events}
          properties={{
            icon: 'add',
            size: properties.size,
            title: get(properties, 'addItemButton.title', { default: 'Add Item' }),
            type: 'default',
            ...properties.addItemButton,
          }}
          onClick={addItemToFront}
        />
      )}
    </div>
  );
  const footer = !properties.addToFront && !properties.hideAddButton && (
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
        components={{ Icon, Link, ShortcutBadge }}
        events={events}
        properties={{
          icon: 'add',
          size: properties.size,
          title: get(properties, 'addItemButton.title', { default: 'Add Item' }),
          type: 'dashed',
          ...properties.addItemButton,
        }}
        onClick={addItemToBack}
      />
    </div>
  );
  const showRemoveButton = !properties.hideRemoveButton && list.length > minItems;
  let emptyText = properties.noDataTitle ?? 'No Items';
  // antd List showed its empty illustration when noDataTitle was an empty string.
  if (emptyText === '') emptyText = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return (
    <div
      id={blockId}
      className={classnames(
        'ant-list',
        sizeClassNames[properties.size ?? componentSize],
        'ant-list-split',
        'ant-list-bordered',
        {
          'ant-list-something-after-last-item': footer,
          'ant-list-rtl': direction === 'rtl',
        },
        classNames.element
      )}
      style={{ ...getListThemeStyle(theme?.components?.List), ...styles.element }}
    >
      {header && <div className="ant-list-header">{header}</div>}
      {list.length > 0 ? (
        <ul className="ant-list-items ant-list-container">
          {list.map((item, i) => (
            <li
              key={`${blockId}_${i}`}
              className="ant-list-item"
              style={{ width: '100%', ...styles.item }}
            >
              {item.content && item.content({ width: '100%' })}
              {showRemoveButton && (
                <span
                  aria-disabled={componentDisabled || undefined}
                  className={cn(
                    'lf-controlled-list-remove',
                    componentDisabled && 'lf-controlled-list-remove-disabled',
                    classNames.removeIcon
                  )}
                  style={styles.removeIcon}
                >
                  <Icon
                    blockId={`${blockId}_${i}_remove_icon`}
                    events={events}
                    properties={{
                      name: 'remove',
                      ...properties.removeItemIcon,
                    }}
                    onClick={componentDisabled ? undefined : () => removeItemAt(i)}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="ant-list-empty-text">{emptyText}</div>
      )}
      {footer && <div className="ant-list-footer">{footer}</div>}
    </div>
  );
};

export default withTheme('List', withBlockDefaults(ControlledListBlock));
