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
import { Input } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Label from '../Label/Label.js';
import useRunAfterUpdate from '../../useRunAfterUpdate.js';

const TextInput = ({
  blockId,
  components: { Icon, Link },
  events,
  loading,
  methods,
  onChange,
  properties,
  required,
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => {
          const runAfterUpdate = useRunAfterUpdate();
          return (
            <Input
              id={`${blockId}_input`}
              allowClear={properties.allowClear}
              autoFocus={properties.autoFocus}
              bordered={properties.bordered}
              className={methods.makeCssClass(properties.inputStyle)}
              disabled={properties.disabled || loading}
              maxLength={properties.maxLength}
              placeholder={properties.placeholder}
              size={properties.size}
              showCount={properties.showCount}
              status={validation.status}
              value={value}
              type={properties.type}
              onChange={
                onChange ||
                ((event) => {
                  let input = event.target.value;

                  if (properties.replaceInput) {
                    const regex = new RegExp(
                      properties.replaceInput.pattern,
                      properties.replaceInput.flags ?? 'gm'
                    );
                    input = input.replace(regex, properties.replaceInput.replacement ?? '');
                  }

                  methods.setValue(input);
                  methods.triggerEvent({ name: 'onChange' });
                  const cStart = event.target.selectionStart;
                  const cEnd = event.target.selectionEnd;
                  runAfterUpdate(() => {
                    // Allows for input types that don't support SelectionRange
                    if (
                      ![
                        'email',
                        'date',
                        'datetime-local',
                        'month',
                        'number',
                        'time',
                        'week',
                        'range',
                        'color',
                        'file',
                      ].includes(properties.type)
                    ) {
                      event.target.setSelectionRange(cStart, cEnd);
                    }
                  });
                })
              }
              onPressEnter={() => {
                methods.triggerEvent({ name: 'onPressEnter' });
              }}
              onBlur={() => {
                methods.triggerEvent({ name: 'onBlur' });
              }}
              onFocus={() => {
                methods.triggerEvent({ name: 'onFocus' });
              }}
              prefix={
                properties.prefix ||
                (properties.prefixIcon && (
                  <Icon
                    blockId={`${blockId}_prefixIcon`}
                    events={events}
                    properties={properties.prefixIcon}
                  />
                ))
              }
              suffix={
                (properties.suffix || properties.suffixIcon) && (
                  <>
                    {properties.suffix && properties.suffix}
                    {properties.suffixIcon && (
                      <Icon
                        blockId={`${blockId}_suffixIcon`}
                        events={events}
                        properties={properties.suffixIcon}
                      />
                    )}
                  </>
                )
              }
            />
          );
        },
      }}
    />
  );
};

TextInput.defaultProps = blockDefaultProps;
TextInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/TextInput/style.less'],
};

export default TextInput;
