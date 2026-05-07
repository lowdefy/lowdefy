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
import { Badge, Calendar } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';
import disabledDate from '../../disabledDate.js';

dayjs.extend(utc);

function buildDateMap(dateCellData) {
  if (!type.isArray(dateCellData)) return { map: {}, earliest: undefined };
  const map = {};
  let earliest;
  dateCellData.forEach((item) => {
    if (type.isNone(item?.date)) return;
    const parsed = dayjs(item.date);
    if (!parsed.isValid()) return;
    const key = parsed.format('YYYY-MM-DD');
    if (!map[key]) map[key] = [];
    map[key].push(item);
    if (!earliest || parsed.isBefore(earliest)) earliest = parsed;
  });
  return { map, earliest };
}

// Pick a default month to open on when `value` is unset: earliest event date
// from dateCellData, or the earliest specific disabled date, or the min of a
// disabledDates range. Without this, a calendar whose data lives in a past or
// future month opens on "today" and shows nothing, confusing the user.
function pickDefaultValue({ earliestCellData, disabledDates }) {
  if (earliestCellData) return earliestCellData;
  if (type.isObject(disabledDates)) {
    if (type.isArray(disabledDates.dates) && disabledDates.dates.length > 0) {
      let earliest;
      disabledDates.dates.forEach((d) => {
        const parsed = dayjs(d);
        if (parsed.isValid() && (!earliest || parsed.isBefore(earliest))) earliest = parsed;
      });
      if (earliest) return earliest;
    }
    if (!type.isNone(disabledDates.min)) {
      const parsed = dayjs(disabledDates.min);
      if (parsed.isValid()) return parsed;
    }
  }
  return undefined;
}

const CalendarBlock = ({
  blockId,
  classNames = {},
  events,
  methods,
  properties,
  styles = {},
  value,
}) => {
  const { map: dateMap, earliest: earliestCellData } = buildDateMap(properties.dateCellData);
  const hasDateData = Object.keys(dateMap).length > 0;
  const defaultPanel = pickDefaultValue({
    earliestCellData,
    disabledDates: properties.disabledDates,
  });

  return (
    <div id={blockId}>
    <Calendar
      className={classNames.element}
      style={styles.element}
      fullscreen={properties.fullscreen !== false}
      mode={properties.mode}
      disabledDate={disabledDate(properties.disabledDates ?? {})}
      validRange={
        type.isArray(properties.validRange) && properties.validRange.length === 2
          ? [dayjs(properties.validRange[0]), dayjs(properties.validRange[1])]
          : undefined
      }
      value={type.isDate(value) ? dayjs(value) : undefined}
      defaultValue={!type.isDate(value) ? defaultPanel : undefined}
      onSelect={(date, selectInfo) => {
        // Wrap with our dayjs — antd v6's internal dayjs may lack the utc plugin.
        const d = dayjs(date);
        const val = d.toDate();
        const source = selectInfo?.source ?? 'date';
        // Only fire for date cell clicks — year/month panel navigation emits
        // onSelect too but shouldn't push a value through the event chain.
        if (source !== 'date' && source !== 'customize') return;
        methods.setValue(val);
        methods.triggerEvent({
          name: 'onSelect',
          event: {
            value: val,
            date: d.format('YYYY-MM-DD'),
            source,
          },
        });
      }}
      onChange={(date) => {
        const d = dayjs(date);
        const val = d.toDate();
        methods.setValue(val);
        methods.triggerEvent({
          name: 'onChange',
          event: {
            value: val,
            date: d.format('YYYY-MM-DD'),
          },
        });
      }}
      onPanelChange={(date, mode) => {
        const d = dayjs(date);
        methods.triggerEvent({
          name: 'onPanelChange',
          event: {
            value: d.toDate(),
            date: d.format('YYYY-MM-DD'),
            mode,
          },
        });
      }}
      cellRender={
        hasDateData
          ? (current, info) => {
              if (info.type !== 'date') return info.originNode;
              const key = dayjs(current).format('YYYY-MM-DD');
              const items = dateMap[key];
              // cellRender output is appended to the default date cell — return
              // null for days with no events to avoid double-rendering the date.
              if (!items) return null;
              return (
                <ul
                  className="ant-picker-calendar-events"
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                >
                  {items.map((item, i) => (
                    <li key={i}>
                      <Badge
                        status={item.status ?? 'default'}
                        color={item.color}
                        text={item.content}
                      />
                    </li>
                  ))}
                </ul>
              );
            }
          : undefined
      }
    />
    </div>
  );
};

export default withTheme('Calendar', withBlockDefaults(CalendarBlock));
