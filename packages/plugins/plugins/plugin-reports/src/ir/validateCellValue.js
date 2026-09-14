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

// A cell value is a string, number, boolean, null, undefined, or Date. Nothing
// else may reach a translator: ExcelJS types a cell by the shape of its value,
// so an object carrying a `formula` key would become a live formula in the
// workbook — a row value from a data source must never be able to do that.
function validateCellValue(value) {
  if (type.isNone(value) || type.isString(value) || type.isBoolean(value)) return true;
  return type.isNumber(value) || type.isDate(value);
}

export default validateCellValue;
