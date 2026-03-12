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

import React, { useState } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import disabledDate from '../../disabledDate.js';

dayjs.extend(utc);

const DateTimeSelector = ({
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
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  const timeUnit = !type.isString(properties.timeFormat)
    ? 'minute'
    : properties.timeFormat === 'HH:mm:ss'
      ? 'second'
      : properties.timeFormat === 'HH'
        ? 'hour'
        : 'minute';
  const onChange = (newVal) => {
    const val = !newVal
      ? null
      : dayjs
          .utc(newVal.add(properties.selectUTC ? newVal.utcOffset() : 0, 'minutes'))
          .startOf(timeUnit)
          .toDate();
    methods.setValue(val);
    methods.triggerEvent({ name: 'onChange', event: { value: val } });
  };
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
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <DatePicker
              id={`${blockId}_input`}
              allowClear={properties.allowClear !== false}
              autoFocus={properties.autoFocus}
              variant={properties.bordered === false ? 'borderless' : properties.variant}
              className={classNames.element}
              style={{ width: '100%', ...styles.element }}
              disabled={properties.disabled || loading}
              disabledDate={disabledDate(properties.disabledDates)}
              format={properties.format ?? 'YYYY-MM-DD HH:mm'}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              placeholder={properties.placeholder ?? 'Select Date & Time'}
              showNow={properties.showNow}
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
              showTime={{
                format: properties.timeFormat ?? 'HH:mm',
                hourStep: properties.hourStep ?? 1,
                minuteStep: properties.minuteStep ?? 5,
                secondStep: properties.secondStep ?? 30,
              }}
              onChange={onChange}
              onSelect={
                // NOTE: we use on select instead of onChange to make the block UX
                // more like the DataSelector which changes date on click and not on ok.
                onChange
              }
              value={
                !type.isDate(value) ? null : properties.selectUTC ? dayjs.utc(value) : dayjs(value)
              }
            />
          </div>
        ),
      }}
    />
  );
};

export default withTheme('DatePicker', withBlockDefaults(DateTimeSelector));
