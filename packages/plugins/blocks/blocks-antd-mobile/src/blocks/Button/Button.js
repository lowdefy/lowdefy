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
import { Button } from 'antd-mobile';
import { get, type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

function ButtonBlock({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  onClick,
  properties,
  rename,
  styles = {},
}) {
  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  return (
    <Button
      id={blockId}
      block={properties.block}
      className={classNames.element}
      style={styles.element}
      color={properties.color ?? 'primary'}
      disabled={properties.disabled || get(events, `${onClickActionName}.loading`) || loading}
      fill={properties.fill}
      loading={get(events, `${onClickActionName}.loading`)}
      shape={properties.shape}
      size={properties.size}
      onClick={onClick || (() => methods.triggerEvent({ name: onClickActionName }))}
    >
      {properties.icon && (
        <Icon
          blockId={`${blockId}_icon`}
          classNames={{ element: classNames.icon }}
          events={events}
          properties={properties.icon}
          styles={{ element: styles.icon }}
        />
      )}
      {!properties.hideTitle &&
        renderHtml({
          html: type.isNone(properties.title) ? blockId : properties.title,
          methods,
        })}
    </Button>
  );
}

export default withBlockDefaults(ButtonBlock);
