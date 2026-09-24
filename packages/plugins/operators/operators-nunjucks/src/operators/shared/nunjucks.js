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
import { nunjucksFunction } from '@lowdefy/nunjucks';

function _nunjucks({ params, state, payload, runtime }) {
  let templateString;
  let on;
  if (type.isObject(params) && type.isString(params.template)) {
    templateString = params.template;
    on = type.isObject(params.on) ? params.on : {};
  }
  if (type.isString(params)) {
    templateString = params;
    on = runtime === 'browser' ? state : payload;
  }
  if (templateString) {
    try {
      const template = nunjucksFunction(templateString);
      return template(on);
    } catch (e) {
      throw new Error('_nunjucks failed to parse nunjucks template.', { cause: e });
    }
  }
  return null;
}

_nunjucks.dynamic = false;
// A string template renders against the whole of state, so which paths it reads is not known.
// The date filter compares with the clock for relative methods (fromNow, isBefore with no
// argument, ...), and a format held in a variable could name one of them. A missing date
// renders as '' so it is not clock-dependent.
const clockRelativeDateFilter =
  /\bdate\s*\(\s*(?!['"])|\bdate\s*\(\s*['"](fromNow|toNow|from|to|isBefore|isAfter|isSame|isSameOrBefore|isSameOrAfter|diff|isToday|isYesterday|isTomorrow)['"]/;

_nunjucks.tracking = ({ params }) => {
  const template = type.isString(params) ? params : params?.template;
  if (type.isString(template) && clockRelativeDateFilter.test(template)) {
    return { kind: 'volatile' };
  }
  if (type.isString(params)) {
    return { kind: 'read', keys: ['state:*'] };
  }
  return { kind: 'pure' };
};

export default _nunjucks;
