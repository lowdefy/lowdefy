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

import React, { useState, useEffect } from 'react';
import { type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { Steps } from 'antd';

import withTheme from '../withTheme.js';

function StepsBlock({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  methods,
  properties,
  styles = {},
}) {
  const [current, setCurrent] = useState(properties.current ?? 0);

  useEffect(() => {
    setCurrent(properties.current ?? 0);
  }, [properties.current]);

  useEffect(() => {
    methods.registerMethod('setCurrent', ({ current: newCurrent }) => {
      setCurrent(newCurrent);
      methods.triggerEvent({ name: 'onChange', event: { current: newCurrent } });
    });
  });

  return (
    <Steps
      id={blockId}
      className={classNames.element}
      style={styles.element}
      current={current}
      initial={properties.initial}
      status={properties.status}
      size={properties.size}
      type={properties.type}
      orientation={properties.orientation}
      titlePlacement={properties.titlePlacement}
      percent={properties.percent}
      progressDot={properties.progressDot}
      responsive={properties.responsive}
      variant={properties.variant}
      onChange={
        events.onChange
          ? (value) => {
              setCurrent(value);
              methods.triggerEvent({ name: 'onChange', event: { current: value } });
            }
          : undefined
      }
      items={(properties.items ?? []).map((item, index) => ({
        key: index,
        title: item.title ? renderHtml({ html: item.title, methods }) : undefined,
        subTitle: item.subTitle ? renderHtml({ html: item.subTitle, methods }) : undefined,
        description: item.description ? renderHtml({ html: item.description, methods }) : undefined,
        status: item.status,
        disabled: item.disabled,
        icon: item.icon ? (
          <Icon
            blockId={`${blockId}_${index}_icon`}
            classNames={{ element: classNames.icon }}
            properties={{
              name: type.isString(item.icon) && item.icon,
              ...(type.isObject(item.icon) ? item.icon : {}),
            }}
            styles={{ element: styles.icon }}
          />
        ) : undefined,
      }))}
    />
  );
}

export default withTheme('Steps', withBlockDefaults(StepsBlock));
