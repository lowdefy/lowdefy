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
import { Input } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import useRunAfterUpdate from '../../useRunAfterUpdate.js';

const TextAreaComp = Input.TextArea;

const TextAreaBlock = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  properties,
  required,
  styles = {},
  validation,
  value,
  methods,
}) => {
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => {
          const runAfterUpdate = useRunAfterUpdate();
          return (
            <TextAreaComp
              id={`${blockId}_input`}
              allowClear={properties.allowClear}
              autoFocus={properties.autoFocus}
              variant={properties.bordered === false ? 'borderless' : properties.variant}
              className={classNames.element}
              style={styles.element}
              disabled={properties.disabled || loading}
              maxLength={properties.maxLength}
              placeholder={properties.placeholder}
              showCount={properties.showCount}
              size={properties.size}
              status={validation.status}
              value={value}
              autoSize={
                properties.rows
                  ? { minRows: properties.rows, maxRows: properties.rows }
                  : type.isNone(properties.autoSize)
                    ? { minRows: 3 }
                    : properties.autoSize
              }
              onChange={(event) => {
                methods.setValue(event.target.value);
                methods.triggerEvent({ name: 'onChange', event: { value: event.target.value } });
                const cStart = event.target.selectionStart;
                const cEnd = event.target.selectionEnd;
                runAfterUpdate(() => {
                  event.target.setSelectionRange(cStart, cEnd);
                });
              }}
              onFocus={() => {
                methods.triggerEvent({ name: 'onFocus' });
              }}
              onBlur={() => {
                methods.triggerEvent({ name: 'onBlur' });
              }}
              onPressEnter={() => {
                methods.triggerEvent({ name: 'onPressEnter' });
              }}
            />
          );
        },
      }}
    />
  );
};

export default withTheme('Input', withBlockDefaults(TextAreaBlock));
