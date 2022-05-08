/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { AutoComplete } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getUniqueValues from '../../getUniqueValues.js';

const Option = AutoComplete.Option;

const AutoCompleteInput = ({
  blockId,
  components,
  events,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  const uniqueValueOptions = getUniqueValues(properties.options || []);
  return (
    <Label
      blockId={blockId}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      content={{
        content: () => (
          <AutoComplete
            id={`${blockId}_input`}
            autoFocus={properties.autoFocus}
            backfill={properties.backfill}
            bordered={properties.bordered}
            className={methods.makeCssClass(properties.inputStyle)}
            defaultOpen={properties.defaultOpen}
            disabled={properties.disabled || loading}
            placeholder={properties.placeholder || 'Type or select item'}
            allowClear={properties.allowClear !== false}
            size={properties.size}
            filterOption={(input, option) =>
              (option.filterstring || option.children.props.html || '')
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            onChange={(newVal) => {
              let val = type.isPrimitive(uniqueValueOptions[newVal])
                ? uniqueValueOptions[newVal]
                : uniqueValueOptions[newVal].value;
              if (type.isNone(val)) {
                val = newVal;
              }
              methods.setValue(val);
              methods.triggerEvent({ name: 'onChange' });
            }}
            onSearch={(newVal) => {
              methods.triggerEvent({ name: 'onSearch', event: { value: newVal } });
            }}
            value={type.isNone(value) ? undefined : value}
          >
            {(properties.options || []).map((opt, i) =>
              type.isPrimitive(opt) ? (
                <Option
                  className={methods.makeCssClass(properties.optionsStyle)}
                  id={`${blockId}_${i}`}
                  key={i}
                  value={`${i}`}
                >
                  {renderHtml({ html: `${opt}`, methods })}
                </Option>
              ) : (
                <Option
                  className={methods.makeCssClass([properties.optionsStyle, opt.style])}
                  disabled={opt.disabled}
                  filterstring={opt.filterString}
                  id={`${blockId}_${i}`}
                  key={i}
                  value={`${i}`}
                >
                  {type.isNone(opt.label)
                    ? renderHtml({ html: `${opt.value}`, methods })
                    : renderHtml({ html: opt.label, methods })}
                </Option>
              )
            )}
          </AutoComplete>
        ),
      }}
    />
  );
};

AutoCompleteInput.defaultProps = blockDefaultProps;
AutoCompleteInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/AutoComplete/style.less'],
};

export default AutoCompleteInput;
