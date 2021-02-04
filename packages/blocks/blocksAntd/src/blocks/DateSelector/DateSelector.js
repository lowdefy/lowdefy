/*
  Copyright 2020-2021 Lowdefy, Inc

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
import moment from 'moment';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { DatePicker } from 'antd';

import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import disabledDate from '../../disabledDate';

const DateSelector = ({ blockId, loading, methods, properties, required, validation, value }) => {
  return (
    <Label
      blockId={blockId}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      loading={loading}
      methods={methods}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <DatePicker
              id={`${blockId}_input`}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              autoFocus={properties.autoFocus}
              disabled={properties.disabled}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              allowClear={properties.allowClear !== false}
              placeholder={properties.placeholder || 'Select Date'}
              format={properties.format || 'YYYY-MM-DD'}
              showToday={properties.showToday}
              size={properties.size}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    blockId={`${blockId}_suffixIcon`}
                    events={events}
                    properties={properties.suffixIcon || 'CalendarOutlined'}
                    methods={methods}
                  />
                )
              }
              disabledDate={disabledDate(properties.disabledDate)}
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

export default DateSelector;
