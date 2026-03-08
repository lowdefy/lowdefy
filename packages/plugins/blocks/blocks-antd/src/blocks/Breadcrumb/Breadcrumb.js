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
import { type, get } from '@lowdefy/helpers';
import { Breadcrumb } from 'antd';

import withTheme from '../withTheme.js';

const BreadcrumbBlock = ({
  blockId,
  classNames = {},
  events,
  components: { Icon, Link },
  methods,
  properties,
  rename,
  styles = {},
}) => {
  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  return (
    <Breadcrumb
      id={blockId}
      className={classNames.element}
      separator={properties.separator}
      style={styles.element}
      items={(properties.list ?? []).map((link, index) => ({
        key: index,
        title: (
          <Link
            id={`${blockId}_${index}`}
            style={{
              cursor: events[onClickActionName] && 'pointer',
              ...(type.isObject(link) ? link.style : {}),
            }}
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
        ),
        onClick:
          events[onClickActionName] &&
          (() => methods.triggerEvent({ name: onClickActionName, event: { link, index } })),
      }))}
    />
  );
};

BreadcrumbBlock.meta = {
  category: 'display',
  icons: [],
  cssKeys: ['element'],
};

export default withTheme('Breadcrumb', BreadcrumbBlock);
