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
import { type } from '@lowdefy/helpers';
import { Badge } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const BadgeBlock = ({
  blockId,
  classNames = {},
  events,
  content,
  components: { Icon },
  properties,
  styles = {},
}) => {
  if (type.isObject(properties.ribbon)) {
    return (
      <Badge.Ribbon
        classNames={{ root: classNames.element, indicator: classNames.indicator }}
        color={properties.ribbon.color}
        placement={properties.ribbon.placement ?? undefined}
        styles={{ root: styles.element, indicator: styles.indicator }}
        text={properties.ribbon.text}
      >
        {content.content && content.content()}
      </Badge.Ribbon>
    );
  }
  return (
    <Badge
      id={blockId}
      className={classNames.element}
      classNames={{ indicator: classNames.indicator }}
      color={properties.color}
      dot={properties.dot}
      offset={properties.offset}
      overflowCount={type.isNumber(properties.overflowCount) ? properties.overflowCount : 100}
      showZero={properties.showZero}
      // antd 6 renamed the `default` size to `medium`.
      size={properties.size === 'default' ? 'medium' : properties.size}
      status={properties.status}
      style={styles.element}
      styles={{ indicator: styles.indicator }}
      text={properties.text}
      title={properties.title}
      count={
        (properties.icon && (
          <Icon
            blockId={`${blockId}_icon`}
            classNames={{ element: classNames.icon }}
            events={events}
            properties={properties.icon}
            styles={{ element: styles.icon }}
          />
        )) ||
        properties.count
      }
    >
      {content.content && content.content()}
    </Badge>
  );
};

export default withTheme('Badge', withBlockDefaults(BadgeBlock));
