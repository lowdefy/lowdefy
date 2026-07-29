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

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

dayjs.extend(utc);

// The picker hands a preset value straight to onChange, so a preset must be shaped like the dayjs
// value a calendar cell click produces: a local mode dayjs whose wall clock reads the intended
// date. The date pickers read their value as a UTC wall clock (dayjs.utc(value)), so the UTC wall
// clock of the configured date is rebuilt in local mode - onChange then normalises it back to UTC
// the same way it does for a cell click. DateTimeSelector without selectUTC reads its value in
// local time, so there the configured date is used as the instant it is.
function toPickerDate(date, local) {
  if (local) return dayjs(date);
  return dayjs(dayjs.utc(date).format('YYYY-MM-DDTHH:mm:ss'));
}

const getPresets = ({ local, methods, presets }) => {
  if (type.isNone(presets)) return undefined;
  return presets.map((preset) => ({
    label: renderHtml({ html: preset.label, methods }),
    value: type.isArray(preset.value)
      ? preset.value.map((date) => toPickerDate(date, local))
      : toPickerDate(preset.value, local),
  }));
};

export default getPresets;
