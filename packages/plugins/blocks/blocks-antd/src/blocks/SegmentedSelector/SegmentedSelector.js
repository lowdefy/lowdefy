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
import getSelectedIndex from '../../getSelectedIndex.js';
import useDisabled from '../../useDisabled.js';
import useSelectorOptions from '../../useSelectorOptions.js';
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
  const uniqueValueOptions = useSelectorOptions({ properties, methods });
  // antd Segmented doesn't read ConfigProvider componentDisabled itself.
  const disabled = useDisabled({ loading, properties });
  return (
    <Label
      blockId={blockId}
      methods={methods}
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
            classNames={{ item: classNames.options }}
            style={styles.element}
            styles={{ item: styles.options }}
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
                    disabled: opt.disabled || disabled,
                    icon: opt.icon ? (
                      <Icon
                        blockId={`${blockId}_${i}_icon`}
                        classNames={{ element: classNames.icon }}
                        events={events}
                        properties={opt.icon}
                        styles={{ element: styles.icon }}
                      />
                    ) : undefined,
                    tooltip: opt.tooltip,
                  }
            )}
            // antd 6 renamed the `middle` size to `medium`.
            size={properties.size === 'middle' ? 'medium' : properties.size}
            block={properties.block}
            disabled={disabled}
            vertical={properties.vertical}
            shape={properties.shape}
            // An undefined value leaves antd's Segmented uncontrolled, and it then selects its
            // first option; null keeps it controlled with nothing selected.
            value={
              type.isNone(value)
                ? null
                : getSelectedIndex(value, uniqueValueOptions, { properties }) ?? null
            }
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
