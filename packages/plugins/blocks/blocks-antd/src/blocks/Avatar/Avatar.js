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
import { Avatar } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

// antd 6 renamed the `default` size to `medium`.
function getAvatarSize(size) {
  return size === 'default' ? 'medium' : size;
}

const AvatarBlock = ({
  blockId,
  classNames = {},
  events,
  components: { Icon },
  methods,
  properties,
  styles = {},
}) => {
  if (properties.group) {
    return (
      <Avatar.Group
        className={classNames.element}
        style={{
          cursor: events.onClick && 'pointer',
          ...styles.element,
        }}
        max={{
          count: properties.group.maxCount,
          style: styles.max,
          popover: {
            placement: properties.group.maxPopoverPlacement,
            trigger: properties.group.maxPopoverTrigger,
          },
        }}
        shape={properties.group.shape ?? properties.shape}
        size={getAvatarSize(properties.group.size ?? properties.size)}
      >
        {(properties.group.avatars ?? []).map((avatar, i) => (
          <Avatar
            key={`${blockId}_${i}`}
            alt={avatar.alt}
            gap={avatar.gap}
            shape={avatar.shape}
            size={getAvatarSize(avatar.size)}
            src={avatar.src}
            srcSet={avatar.srcSet}
            style={{ backgroundColor: !avatar.src && avatar.color }}
            onClick={() => methods.triggerEvent({ name: 'onClick', event: { index: i } })}
            icon={
              avatar.icon && (
                <Icon
                  blockId={`${blockId}_avatar_${i}_icon`}
                  classNames={{ element: classNames.icon }}
                  events={events}
                  properties={avatar.icon}
                  styles={{ element: styles.icon }}
                />
              )
            }
          >
            {avatar.content}
          </Avatar>
        ))}
      </Avatar.Group>
    );
  }

  return (
    <Avatar
      id={blockId}
      alt={properties.alt}
      className={classNames.element}
      gap={properties.gap}
      shape={properties.shape}
      size={getAvatarSize(properties.size)}
      src={properties.src}
      srcSet={properties.srcSet}
      onClick={() => methods.triggerEvent({ name: 'onClick' })}
      style={{
        backgroundColor: !properties.src && properties.color,
        cursor: events.onClick && 'pointer',
        ...styles.element,
      }}
      icon={
        properties.icon && (
          <Icon
            blockId={`${blockId}_icon`}
            classNames={{ element: classNames.icon }}
            events={events}
            properties={properties.icon}
            styles={{ element: styles.icon }}
          />
        )
      }
    >
      {properties.content}
    </Avatar>
  );
};

export default withTheme('Avatar', withBlockDefaults(AvatarBlock));
