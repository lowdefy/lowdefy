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

// Coerce a datum to a value the report IR admits in a table cell: a string,
// number, boolean, null, undefined, or Date. Anything else is serialised to a
// JSON string so a row value shaped like a spreadsheet formula object can never
// reach the workbook writer as an object — ExcelJS types cells by shape, so an
// object with a `formula` key would become a live formula.
function toCellValue(value) {
  if (type.isNone(value) || type.isString(value) || type.isBoolean(value)) {
    return value;
  }
  if (type.isNumber(value) || type.isDate(value)) {
    return value;
  }
  if (type.isFunction(value)) {
    return undefined;
  }
  return JSON.stringify(value);
}

export default toCellValue;
