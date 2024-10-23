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

import React, { useState } from 'react';
import { DatePicker } from 'antd';
import moment from 'moment';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import disabledDate from '../../disabledDate.js';

const RangePicker = DatePicker.RangePicker;

const rangeValue = (value, format) => {
  if (value && format) return value.map((val) => moment.utc(val, format).startOf('day'));
  if (value) return value.map((val) => moment.utc(val).startOf('day'));
  return null;
};

const DateRangeSelector = ({
  blockId,
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  return (
    <Label
      blockId={blockId}
      components={{ Icon }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_${elementId}_popup`} />
            <RangePicker
              id={`${blockId}_input`}
              allowClear={properties.allowClear !== false}
              autoFocus={properties.autoFocus}
              bordered={properties.bordered}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              disabled={properties.disabled || loading}
              disabledDate={disabledDate(properties.disabledDates)}
              format={properties.format ?? 'YYYY-MM-DD'}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              separator={properties.separator ?? '~'}
              size={properties.size}
              status={validation.status}
              placeholder={
                (type.isArray(properties.placeholder) && [
                  properties.placeholder[0] ?? 'Start Date',
                  properties.placeholder[1] ?? 'End Date',
                ]) ?? ['Start Date', 'End Date']
              }
              suffixIcon={
                <Icon
                  blockId={`${blockId}_suffixIcon`}
                  events={events}
                  properties={properties.suffixIcon ?? 'AiOutlineCalendar'}
                />
              }
              onChange={(newVal) => {
                methods.setValue(
                  !newVal
                    ? null
                    : newVal.map((val) =>
                        moment.utc(val.add(val.utcOffset(), 'minutes')).startOf('day').toDate()
                      )
                );
                methods.triggerEvent({ name: 'onChange' });
              }}
              value={rangeValue(value)}
            />
          </div>
        ),
      }}
    />
  );
};

DateRangeSelector.defaultProps = blockDefaultProps;
DateRangeSelector.meta = {
  valueType: 'array',
  category: 'input',
  icons: [...Label.meta.icons, 'AiOutlineCalendar'],
  styles: ['blocks/DateRangeSelector/style.less'],
};

export default DateRangeSelector;
