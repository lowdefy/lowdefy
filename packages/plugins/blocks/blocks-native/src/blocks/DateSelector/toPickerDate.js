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

import { type } from '@lowdefy/helpers';

/**
 * The date a native date picker opens on for a DateSelector value. The value is the chosen day at
 * midnight UTC, as on the web, and a native picker shows local days, so the picker gets that
 * calendar day at local midnight. With no value it opens on today.
 *
 * @param {Object} params
 * @param {Date|null} params.value
 * @returns {Date}
 */
function toPickerDate({ value }) {
  if (!type.isDate(value)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export default toPickerDate;
