/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { runClass } from '@lowdefy/operators';

function createFormatter({ IntlClass }) {
  const formatter = (on, options, locale) => {
    return new IntlClass(locale, options).format(on);
  };
  return formatter;
}

const meta = {
  dateTimeFormat: { namedArgs: ['on', 'options', 'locale'], validTypes: ['array', 'object'] },
  listFormat: { namedArgs: ['on', 'options', 'locale'], validTypes: ['array', 'object'] },
  numberFormat: { namedArgs: ['on', 'options', 'locale'], validTypes: ['array', 'object'] },
  relativeTimeFormat: {
    namedArgs: ['on', 'unit', 'options', 'locale'],
    validTypes: ['array', 'object'],
  },
};

function relativeTimeFormat(on, unit, options, locale) {
  return new Intl.RelativeTimeFormat(locale, options).format(on, unit);
}

const functions = {
  dateTimeFormat: createFormatter({ IntlClass: Intl.DateTimeFormat }),
  listFormat: createFormatter({ IntlClass: Intl.ListFormat }),
  numberFormat: createFormatter({ IntlClass: Intl.NumberFormat }),
  relativeTimeFormat,
};

function intl({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_intl',
    params,
  });
}

export default intl;
