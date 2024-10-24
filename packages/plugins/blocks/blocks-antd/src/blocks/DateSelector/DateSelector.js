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
import moment from 'moment';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { DatePicker } from 'antd';

import Label from '../Label/Label.js';
import disabledDate from '../../disabledDate.js';

const DateSelector = ({
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
            <DatePicker
              id={`${blockId}_input`}
              allowClear={properties.allowClear !== false}
              autoFocus={properties.autoFocus}
              bordered={properties.bordered}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              disabled={properties.disabled || loading}
              format={properties.format ?? 'YYYY-MM-DD'}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              placeholder={properties.placeholder ?? 'Select Date'}
              showToday={properties.showToday}
              size={properties.size}
              status={validation.status}
              suffixIcon={
                <Icon
                  blockId={`${blockId}_suffixIcon`}
                  events={events}
                  properties={properties.suffixIcon ?? 'AiOutlineCalendar'}
                />
              }
              disabledDate={disabledDate(properties.disabledDates)}
              onChange={(newVal) => {
                methods.setValue(
                  !newVal
                    ? null
                    : moment.utc(newVal.add(newVal.utcOffset(), 'minutes')).startOf('day').toDate()
                );
                methods.triggerEvent({ name: 'onChange' });
              }}
              value={type.isDate(value) ? moment.utc(value).startOf('day') : null}
            />
          </div>
        ),
      }}
    />
  );
};

DateSelector.defaultProps = blockDefaultProps;
DateSelector.meta = {
  valueType: 'date',
  category: 'input',
  icons: [...Label.meta.icons, 'AiOutlineCalendar'],
  styles: ['blocks/DateSelector/style.less'],
};

export default DateSelector;
