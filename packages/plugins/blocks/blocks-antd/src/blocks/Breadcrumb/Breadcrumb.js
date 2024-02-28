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
import { type, get } from '@lowdefy/helpers';
import { Breadcrumb } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

const BreadcrumbBlock = ({
  blockId,
  events,
  components: { Icon, Link },
  methods,
  properties,
  rename,
}) => {
  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  return (
    <Breadcrumb
      id={blockId}
      separator={properties.separator}
      className={methods.makeCssClass(properties.style)}
    >
      {(properties.list || []).map((link, index) => (
        <Breadcrumb.Item
          key={index}
          onClick={
            events[onClickActionName] &&
            (() => methods.triggerEvent({ name: onClickActionName, event: { link, index } }))
          }
        >
          <Link
            id={`${blockId}_${index}`}
            className={methods.makeCssClass([
              {
                cursor: events[onClickActionName] && 'pointer',
              },
              link.style,
            ])}
            {...(type.isObject(link) ? link : {})}
          >
            {() => (
              <>
                {link.icon && (
                  <Icon
                    blockId={`${blockId}_${index}_icon`}
                    events={events}
                    properties={{
                      name: type.isString(link.icon) && link.icon,
                      ...(type.isObject(link.icon) ? link.icon : {}),
                      style: {
                        marginRight: 8,
                        ...(type.isObject(link.icon?.style) ? link.icon.style : {}),
                      },
                    }}
                  />
                )}
                {type.isString(link) ? link : link.label}
              </>
            )}
          </Link>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

BreadcrumbBlock.defaultProps = blockDefaultProps;
BreadcrumbBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Breadcrumb/style.less'],
};

export default BreadcrumbBlock;
