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

// A decimal MongoDB's Decimal128 can hold exactly has at most 34 significant digits.
const MAX_DIGITS = 34;
const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

function significantDigits(value) {
  const [coefficient] = value.replace(/^[+-]/, '').split(/[eE]/);
  return coefficient.replace('.', '').replace(/^0+/, '').length;
}

function _decimal({ params }) {
  // A decimal that was read earlier ({ '~dec': '0.3' }, from a request response or state) is
  // accepted as it is, so it can be passed back without unwrapping it.
  const value = type.isObject(params) && Object.keys(params).length === 1 ? params['~dec'] : params;
  if (!type.isString(value)) {
    throw new Error(
      `_decimal takes a decimal as a string, such as _decimal: '19.99'. A number can lose digits before it reaches the operator, so quote it in YAML. Received ${JSON.stringify(
        params
      )}.`
    );
  }
  if (!DECIMAL_PATTERN.test(value)) {
    throw new Error(
      `_decimal takes a decimal such as '19.99', '-0.5' or '1.5E-7'. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  if (significantDigits(value) > MAX_DIGITS) {
    throw new Error(
      `_decimal holds at most ${MAX_DIGITS} significant digits, so it can be stored exactly. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  return { '~dec': value };
}

_decimal.dynamic = false;
_decimal.tracking = { kind: 'pure' };

export default _decimal;
