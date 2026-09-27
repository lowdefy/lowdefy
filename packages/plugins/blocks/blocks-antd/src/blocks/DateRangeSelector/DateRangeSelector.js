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
import { getLocaleDateFormat, type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import disabledDate from '../../disabledDate.js';
import getPresets from '../../getPresets.js';

dayjs.extend(utc);

const RangePicker = DatePicker.RangePicker;

// With allowEmpty, the start or the end of the range is null.
function toRangeDate(val, format) {
  if (type.isNone(val)) return null;
  if (format) return dayjs.utc(val, format).startOf('day');
  return dayjs.utc(val).startOf('day');
}

function rangeValue(value, format) {
  if (value) return value.map((val) => toRangeDate(val, format));
  return null;
}

const DateRangeSelector = ({
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
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <RangePicker
              id={`${blockId}_input`}
              allowEmpty={properties.allowEmpty}
              allowClear={
                properties.allowClear !== false && {
                  clearIcon: (
                    <Icon
                      blockId={`${blockId}_clearIcon`}
                      properties={{ name: 'clear', title: '' }}
                    />
                  ),
                }
              }
              autoFocus={properties.autoFocus}
              variant={properties.bordered === false ? 'borderless' : properties.variant}
              className={classNames.element}
              classNames={{ popup: { root: classNames.popup } }}
              style={{ width: '100%', ...styles.element }}
              styles={{ popup: { root: styles.popup } }}
              disabled={getDisabled({ loading, properties })}
              disabledDate={disabledDate(properties.disabledDates)}
              format={
                properties.format ?? getLocaleDateFormat(methods.getLocale?.()) ?? 'YYYY-MM-DD'
              }
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              inputReadOnly={properties.inputReadOnly}
              separator={properties.separator ?? '~'}
              showWeek={properties.showWeek}
              size={properties.size}
              status={validation.status}
              placeholder={
                type.isArray(properties.placeholder) ? properties.placeholder : undefined
              }
              placement={properties.placement}
              prefix={
                properties.prefix ||
                (properties.prefixIcon && (
                  <Icon
                    blockId={`${blockId}_prefixIcon`}
                    classNames={{ element: classNames.prefixIcon }}
                    events={events}
                    properties={properties.prefixIcon}
                    styles={{ element: styles.prefixIcon }}
                  />
                ))
              }
              presets={getPresets({
                disabledDates: properties.disabledDates,
                methods,
                presets: properties.presets,
                range: true,
              })}
              suffixIcon={
                <Icon
                  blockId={`${blockId}_suffixIcon`}
                  classNames={{ element: classNames.suffixIcon }}
                  events={events}
                  properties={properties.suffixIcon ?? { name: 'calendar', title: '' }}
                  styles={{ element: styles.suffixIcon }}
                />
              }
              onBlur={(event, info) => {
                methods.triggerEvent({ name: 'onBlur', event: { range: info.range } });
              }}
              onClear={() => {
                methods.triggerEvent({ name: 'onClear' });
              }}
              onFocus={(event, info) => {
                methods.triggerEvent({ name: 'onFocus', event: { range: info.range } });
              }}
              onOpenChange={(open) => {
                methods.triggerEvent({ name: 'onOpenChange', event: { open } });
              }}
              onChange={(newVal) => {
                const val = !newVal
                  ? null
                  : newVal.map((v) => {
                      if (type.isNone(v)) return null;
                      // Wrap with our dayjs — antd v6's internal dayjs may lack the utc plugin.
                      const d = dayjs(v);
                      return dayjs.utc(d.add(d.utcOffset(), 'minutes')).startOf('day').toDate();
                    });
                methods.setValue(val);
                methods.triggerEvent({ name: 'onChange', event: { value: val } });
              }}
              value={rangeValue(value)}
            />
          </div>
        ),
      }}
    />
  );
};

export default withTheme('DatePicker', withBlockDefaults(DateRangeSelector));
