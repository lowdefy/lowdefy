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
import { ConfigProvider, Typography } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import withTheme from '../withTheme.js';

const Title = Typography.Title;

const TitleBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  properties,
  methods,
  styles = {},
}) => {
  const titleEl = (
    <Title
      id={blockId}
      className={classNames.element}
      code={properties.code}
      copyable={
        type.isObject(properties.copyable)
          ? {
              text: properties.copyable.text || properties.content,
              onCopy: () => {
                methods.triggerEvent({
                  name: 'onCopy',
                  event: { value: properties.copyable.text || properties.content },
                });
              },
              icon:
                properties.copyable.icon &&
                (type.isArray(properties.copyable.icon) ? (
                  [
                    <Icon
                      key="copy-icon"
                      blockId={`${blockId}_copyable_before_icon`}
                      events={events}
                      properties={properties.copyable.icon[0]}
                    />,
                    <Icon
                      key="copied-icon"
                      blockId={`${blockId}_copyable_after_icon`}
                      events={events}
                      properties={properties.copyable.icon[1]}
                    />,
                  ]
                ) : (
                  <Icon
                    blockId={`${blockId}_copyable_icon`}
                    events={events}
                    properties={properties.copyable.icon}
                  />
                )),
              tooltips: properties.copyable.tooltips,
            }
          : properties.copyable && {
              text: properties.content,
              onCopy: () => {
                methods.triggerEvent({
                  name: 'onCopy',
                  event: { value: properties.content },
                });
              },
            }
      }
      delete={properties.delete}
      disabled={properties.disabled}
      ellipsis={
        type.isObject(properties.ellipsis)
          ? {
              rows: properties.ellipsis.rows,
              expandable: properties.ellipsis.expandable,
              suffix: properties.ellipsis.suffix,
              // FIX: not working, might be and antd issue.
              // symbol: properties.ellipsis.symbol && <span>{properties.ellipsis.symbol}</span>,
              // "symbol": {
              //   "type": "string",
              //   "description": "Custom ... symbol of ellipsis content."
              // }
              onExpand: (ellipsis) => {
                methods.triggerEvent({
                  name: 'onExpand',
                  event: { ellipsis },
                });
              },
            }
          : properties.ellipsis
      }
      italic={properties.italic}
      level={properties.level}
      mark={properties.mark}
      style={styles.element}
      type={properties.type}
      underline={properties.underline}
    >
      {renderHtml({ html: properties.content, methods })}
    </Title>
  );
  return properties.color ? (
    <ConfigProvider theme={{ components: { Typography: { colorText: properties.color } } }}>
      {titleEl}
    </ConfigProvider>
  ) : (
    titleEl
  );
};

TitleBlock.meta = {
  category: 'display',
  icons: [],
  cssKeys: ['element'],
};

export default withTheme('Typography', TitleBlock);
