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

// A collections declaration is JSON Schema, so a `date` field is
// { type: string, format: date-time } - the same spelling it has in a page
// state contract, a payloadSchema and a responseSchema. The driver hands this
// layer a live Date, so Dates are rendered as the ISO strings the contract
// describes before ajv sees them.
//
// Only Dates. Every other value the driver carries - an ObjectId, a Binary, a
// Decimal128 - is left as the object it is, because the contract describes what
// is written to the database here, not what a browser receives, and a field
// declared `object` has always meant "the driver type this holds".
function toContractShape({ value }) {
  if (type.isDate(value)) {
    return value.toISOString();
  }
  if (type.isArray(value)) {
    return value.map((item) => toContractShape({ value: item }));
  }
  if (!type.isObject(value)) {
    return value;
  }
  const copy = {};
  Object.keys(value).forEach((key) => {
    copy[key] = toContractShape({ value: value[key] });
  });
  return copy;
}

export default toContractShape;
