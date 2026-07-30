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

// The picker hands a preset value straight to onChange, so a preset is read exactly as the block
// reads and writes its value: the date pickers work in a UTC wall clock (dayjs.utc(value)), and
// onChange normalises a UTC mode dayjs to the same instant a cell click produces. DateTimeSelector
// without selectUTC reads its value in local time, so there the date is used as the instant it is.
function toPickerDate({ date, local, preset }) {
  // dayjs reads an undefined date as now, which would make a mistyped preset select today.
  if (type.isNone(date)) {
    throw new Error(`Preset value is missing. Received ${JSON.stringify(preset)}.`);
  }
  const pickerDate = local ? dayjs(date) : dayjs.utc(date);
  if (!pickerDate.isValid()) {
    throw new Error(`Preset value is not a date. Received ${JSON.stringify(preset)}.`);
  }
  return pickerDate;
}

// The picker does not check the arity of a preset value. A range picker commits a value of one date
// as a range of one date, and a single picker throws inside its formatter. The block knows which
// shape it takes, so the mismatch is caught here rather than inferred from the configured value.
function toPickerValue({ local, preset, range }) {
  if (range) {
    if (!type.isArray(preset.value) || preset.value.length !== 2) {
      throw new Error(
        `Preset value is not an array of a start and an end date. Received ${JSON.stringify(
          preset
        )}.`
      );
    }
    return preset.value.map((date) => toPickerDate({ date, local, preset }));
  }
  if (type.isArray(preset.value)) {
    throw new Error(
      `Preset value is an array, but the block selects a single date. Received ${JSON.stringify(
        preset
      )}.`
    );
  }
  return toPickerDate({ date: preset.value, local, preset });
}

const getPresets = ({ local, methods, presets, range }) => {
  if (type.isNone(presets)) return undefined;
  if (!type.isArray(presets)) {
    throw new Error(`Presets is not an array. Received ${JSON.stringify(presets)}.`);
  }
  return presets.map((preset) => {
    if (!type.isObject(preset)) {
      throw new Error(`Preset is not an object. Received ${JSON.stringify(preset)}.`);
    }
    // renderHtml renders nothing for a missing label, which would list an empty shortcut.
    if (!type.isString(preset.label)) {
      throw new Error(`Preset label is not a string. Received ${JSON.stringify(preset)}.`);
    }
    return {
      label: renderHtml({ html: preset.label, methods }),
      value: toPickerValue({ local, preset, range }),
    };
  });
};

export default getPresets;
