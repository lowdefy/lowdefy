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

// OTLP/JSON models every attribute value as a one-key AnyValue. A log line is
// already JSON-safe (pino serialized it), so the only shapes reaching here are
// the JSON ones.
function toOtlpAnyValue(value) {
  if (type.isString(value)) {
    return { stringValue: value };
  }
  if (type.isBoolean(value)) {
    return { boolValue: value };
  }
  if (type.isInt(value)) {
    // intValue is a 64-bit integer, which JSON cannot hold - OTLP/JSON carries
    // it as a string.
    return { intValue: String(value) };
  }
  if (type.isNumber(value)) {
    return { doubleValue: value };
  }
  if (type.isArray(value)) {
    return { arrayValue: { values: value.map(toOtlpAnyValue) } };
  }
  if (type.isObject(value)) {
    return {
      kvlistValue: {
        values: Object.keys(value).map((key) => ({ key, value: toOtlpAnyValue(value[key]) })),
      },
    };
  }
  // null, undefined and anything else JSON.stringify dropped: an empty
  // AnyValue is the OTLP representation of "present but empty".
  return {};
}

export default toOtlpAnyValue;
