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

import { CronExpressionParser } from 'cron-parser';
// The i18n build registers every cronstrue locale, so _cron.describe can take a locale.
import cronstrue from 'cronstrue/i18n.js';
import { type } from '@lowdefy/helpers';
import { runClass } from '@lowdefy/operators';

function readParams({ params }) {
  if (type.isString(params)) {
    return { expression: params };
  }
  if (type.isObject(params)) {
    return params;
  }
  // Only describe and validate accept null and undefined, both read a missing expression.
  return {};
}

function getCurrentDate({ method, from }) {
  if (type.isNone(from)) {
    return new Date();
  }
  if (type.isDate(from)) {
    return from;
  }
  if (type.isString(from)) {
    const parsed = new Date(from);
    if (!type.isDate(parsed)) {
      throw new Error(
        `_cron.${method} could not resolve "from" as a date. Received ${JSON.stringify(from)}.`
      );
    }
    return parsed;
  }
  throw new Error(
    `_cron.${method} "from" must be a date or a date string. Received ${JSON.stringify(from)}.`
  );
}

function getTimezone({ method, timezone }) {
  if (type.isNone(timezone)) {
    return null;
  }
  if (!type.isString(timezone)) {
    throw new Error(
      `_cron.${method} "timezone" must be an IANA timezone name. Received ${JSON.stringify(
        timezone
      )}.`
    );
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    throw new Error(
      `_cron.${method} "timezone" is not a valid IANA timezone name. Received ${JSON.stringify(
        timezone
      )}.`
    );
  }
  return timezone;
}

function getCount({ method, count }) {
  if (type.isNone(count)) {
    return 1;
  }
  if (!type.isInt(count) || count < 1) {
    throw new Error(
      `_cron.${method} "count" must be an integer greater than zero. Received ${JSON.stringify(
        count
      )}.`
    );
  }
  return count;
}

function parseExpression({ method, expression, from, timezone }) {
  if (!type.isString(expression)) {
    throw new Error(
      `_cron.${method} requires a cron expression string. Received ${JSON.stringify(expression)}.`
    );
  }
  const options = { currentDate: getCurrentDate({ method, from }) };
  const tz = getTimezone({ method, timezone });
  if (!type.isNone(tz)) {
    options.tz = tz;
  }
  try {
    return CronExpressionParser.parse(expression, options);
  } catch (error) {
    throw new Error(
      `_cron.${method} could not parse the cron expression ${JSON.stringify(expression)}. ${
        error.message
      }`
    );
  }
}

function next(params) {
  const { expression, from, timezone, count } = readParams({ params });
  const steps = getCount({ method: 'next', count });
  const interval = parseExpression({ method: 'next', expression, from, timezone });
  if (steps === 1) {
    return interval.next().toDate();
  }
  return interval.take(steps).map((occurrence) => occurrence.toDate());
}

function previous(params) {
  const { expression, from, timezone, count } = readParams({ params });
  const steps = getCount({ method: 'previous', count });
  const interval = parseExpression({ method: 'previous', expression, from, timezone });
  if (steps === 1) {
    return interval.prev().toDate();
  }
  // A negative limit walks backwards, so occurrences are returned most recent first.
  return interval.take(-steps).map((occurrence) => occurrence.toDate());
}

function describe(params) {
  const { expression, locale, verbose, use24HourTimeFormat } = readParams({ params });
  if (type.isNone(expression) || expression === '') {
    return '';
  }
  if (!type.isString(expression)) {
    throw new Error(
      `_cron.describe requires a cron expression string. Received ${JSON.stringify(expression)}.`
    );
  }
  const options = { throwExceptionOnParseError: true };
  // Locales set their own time format, so only override what the config asks for.
  if (!type.isNone(locale)) {
    options.locale = locale;
  }
  if (!type.isNone(verbose)) {
    options.verbose = verbose;
  }
  if (!type.isNone(use24HourTimeFormat)) {
    options.use24HourTimeFormat = use24HourTimeFormat;
  }
  try {
    return cronstrue.toString(expression, options);
  } catch (error) {
    // cronstrue throws a string that is already prefixed with "Error: ".
    const message = type.isString(error) ? error.replace(/^Error:\s*/, '') : error.message;
    throw new Error(
      `_cron.describe could not describe the cron expression ${JSON.stringify(
        expression
      )}. ${message}`
    );
  }
}

function validate(params) {
  const { expression } = readParams({ params });
  if (!type.isString(expression)) {
    return false;
  }
  try {
    CronExpressionParser.parse(expression);
    return true;
  } catch {
    return false;
  }
}

function fields(params) {
  const { expression } = readParams({ params });
  const interval = parseExpression({ method: 'fields', expression });
  return interval.fields.serialize();
}

const meta = {
  // next and previous default to the current time, so they may not be resolved at build time.
  next: { singleArg: true, validTypes: ['string', 'object'], dynamic: true },
  previous: { singleArg: true, validTypes: ['string', 'object'], dynamic: true },
  describe: { singleArg: true, validTypes: ['string', 'object', 'null', 'undefined'] },
  validate: { singleArg: true, validTypes: ['string', 'object', 'null', 'undefined'] },
  fields: { singleArg: true, validTypes: ['string', 'object'] },
};

const functions = { next, previous, describe, validate, fields };

function _cron({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_cron',
    params,
  });
}

_cron.dynamic = false;
_cron.meta = meta;

export default _cron;
