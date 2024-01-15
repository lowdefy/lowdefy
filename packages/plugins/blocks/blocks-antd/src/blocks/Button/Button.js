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
import { Button } from 'antd';
import { get, type } from '@lowdefy/helpers';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

import color from '../../color.js';

const ButtonBlock = ({
  blockId,
  components: { Icon },
  events,
  loading,
  methods,
  onClick,
  properties,
  rename,
}) => {
  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  return (
    <Button
      block={properties.block}
      className={methods.makeCssClass([
        {
          backgroundColor: properties.color,
          borderColor: properties.color,
          '&:active': properties.color && {
            backgroundColor: color(properties.color, 7),
            borderColor: color(properties.color, 7),
          },
          '&:hover': properties.color && {
            backgroundColor: color(properties.color, 5),
            borderColor: color(properties.color, 5),
          },
          '&:focus': properties.color && {
            backgroundColor: properties.color,
            borderColor: properties.color,
          },
        },
        properties.style,
      ])}
      disabled={properties.disabled || get(events, `${onClickActionName}.loading`) || loading}
      ghost={properties.ghost}
      danger={properties.danger}
      href={properties.href}
      id={blockId}
      loading={get(events, `${onClickActionName}.loading`)}
      shape={properties.shape}
      size={properties.size}
      type={get(properties, 'type', { default: 'primary' })}
      icon={
        properties.icon && (
          <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
        )
      }
      onClick={onClick || (() => methods.triggerEvent({ name: onClickActionName }))}
    >
      {!properties.hideTitle &&
        renderHtml({
          html: type.isNone(properties.title) ? blockId : properties.title,
          methods,
        })}
    </Button>
  );
};

ButtonBlock.defaultProps = blockDefaultProps;
ButtonBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Button/style.less'],
};

export default ButtonBlock;
