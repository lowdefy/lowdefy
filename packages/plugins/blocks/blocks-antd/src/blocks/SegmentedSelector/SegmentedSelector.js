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
import { Segmented } from 'antd';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getValueIndex from '../../getValueIndex.js';
import getUniqueValues from '../../getUniqueValues.js';
import withTheme from '../withTheme.js';

const SegmentedSelector = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const uniqueValueOptions = getUniqueValues(properties.options || []);
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={{ Icon }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <Segmented
            id={`${blockId}_input`}
            className={classNames.element}
            style={styles.element}
            options={uniqueValueOptions.map((opt, i) =>
              type.isPrimitive(opt)
                ? {
                    label: renderHtml({ html: `${opt}`, methods }),
                    value: `${i}`,
                  }
                : {
                    label: type.isNone(opt.label)
                      ? renderHtml({ html: `${opt.value}`, methods })
                      : renderHtml({ html: opt.label, methods }),
                    value: `${i}`,
                    disabled: opt.disabled || properties.disabled || loading,
                    icon: opt.icon ? (
                      <Icon
                        blockId={`${blockId}_${i}_icon`}
                        classNames={{ element: classNames.icon }}
                        events={events}
                        properties={opt.icon}
                        styles={{ element: styles.icon }}
                      />
                    ) : undefined,
                  }
            )}
            size={properties.size}
            block={properties.block}
            disabled={properties.disabled || loading}
            vertical={properties.vertical}
            shape={properties.shape}
            value={type.isNone(value) ? undefined : getValueIndex(value, properties.options || [])}
            onChange={(index) => {
              const val = type.isPrimitive(uniqueValueOptions[index])
                ? uniqueValueOptions[index]
                : uniqueValueOptions[index].value;
              methods.setValue(val);
              methods.triggerEvent({ name: 'onChange', event: { value: val } });
            }}
          />
        ),
      }}
    />
  );
};

export default withTheme('Segmented', withBlockDefaults(SegmentedSelector));
