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
// The i18n build registers every cronstrue locale, so _cron.describe can take a locale. The
// locales add about 35 kB gzipped, and are only bundled into apps that use _cron.
import cronstrue from 'cronstrue/i18n.js';
import { type } from '@lowdefy/helpers';
import { runClass } from '@lowdefy/operators';

import cronstrueLocales from '../../cronstrueLocales.js';

const MAX_COUNT = 1000;

// Only ISO 8601 strings parse the same way in every JavaScript engine.
const ISO_DATE_STRING =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

// A standalone "H", not the H in a day name like THU. cron-parser picks a random value for "H"
// on every evaluation, so the client and server would disagree, and cronstrue can not describe it.
const HASH_TOKEN = /(?:^|[^A-Za-z])H(?![A-Za-z])/;

// cron-parser accepts these aliases but cronstrue can not describe them.
const DESCRIBE_ALIASES = {
  '@minutely': '* * * * *',
  '@secondly': '* * * * * *',
  '@weekdays': '0 0 * * 1-5',
  '@weekends': '0 0 * * 0,6',
};

const LOCALE_CODES = Object.fromEntries(
  cronstrueLocales.map((locale) => [locale.toLowerCase(), locale])
);

function readParams([params]) {
  if (type.isObject(params)) {
    return [params];
  }
  return [{ expression: params }];
}

function isBlankString(value) {
  return type.isString(value) && value.trim() === '';
}

function getCurrentDate({ method, from }) {
  if (type.isNone(from)) {
    return new Date();
  }
  if (type.isDate(from)) {
    return from;
  }
  if (!type.isString(from)) {
    throw new Error(
      `_cron.${method} "from" must be a date or an ISO 8601 date string. Received ${JSON.stringify(
        from
      )}.`
    );
  }
  const parsed = new Date(from);
  if (!ISO_DATE_STRING.test(from) || !type.isDate(parsed)) {
    throw new Error(
      `_cron.${method} "from" is not a valid ISO 8601 date string, like "2024-01-01" or "2024-01-01T09:00:00Z". Received ${JSON.stringify(
        from
      )}.`
    );
  }
  return parsed;
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
  if (!type.isInt(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(
      `_cron.${method} "count" must be an integer from 1 to ${MAX_COUNT}. Received ${JSON.stringify(
        count
      )}.`
    );
  }
  return count;
}

function getOptions({ method, from, timezone }) {
  const options = { currentDate: getCurrentDate({ method, from }) };
  const tz = getTimezone({ method, timezone });
  if (!type.isNone(tz)) {
    options.tz = tz;
  }
  return options;
}

function getLocale({ locale }) {
  if (!type.isString(locale)) {
    throw new Error(
      `_cron.describe "locale" must be a string. Received ${JSON.stringify(locale)}.`
    );
  }
  // cronstrue names regional locales like "pt_BR", so "pt-BR" and "pt_br" are accepted too.
  const code = LOCALE_CODES[locale.replace(/-/g, '_').toLowerCase()];
  if (type.isUndefined(code)) {
    throw new Error(
      `_cron.describe does not support the locale ${JSON.stringify(
        locale
      )}. Use one of: ${cronstrueLocales.join(', ')}.`
    );
  }
  return code;
}

function evaluateExpression({ method, expression, options, evaluate }) {
  if (!type.isString(expression) || isBlankString(expression)) {
    throw new Error(
      `_cron.${method} requires a non-empty cron expression string. Received ${JSON.stringify(
        expression
      )}.`
    );
  }
  if (HASH_TOKEN.test(expression)) {
    throw new Error(
      `_cron.${method} does not support the "H" hash token, use explicit values instead. Received ${JSON.stringify(
        expression
      )}.`
    );
  }
  try {
    const interval = CronExpressionParser.parse(expression, options);
    if (!interval.hasNext()) {
      throw new Error('The expression does not match any date.');
    }
    return evaluate(interval);
  } catch (error) {
    throw new Error(
      `_cron.${method} could not evaluate the cron expression ${JSON.stringify(expression)}. ${
        error.message
      }`
    );
  }
}

function next({ expression, from, timezone, count }) {
  const steps = getCount({ method: 'next', count });
  return evaluateExpression({
    method: 'next',
    expression,
    options: getOptions({ method: 'next', from, timezone }),
    evaluate: (interval) => {
      if (steps === 1) {
        return interval.next().toDate();
      }
      return interval.take(steps).map((occurrence) => occurrence.toDate());
    },
  });
}

function previous({ expression, from, timezone, count }) {
  const steps = getCount({ method: 'previous', count });
  return evaluateExpression({
    method: 'previous',
    expression,
    options: getOptions({ method: 'previous', from, timezone }),
    evaluate: (interval) => {
      if (steps === 1) {
        return interval.prev().toDate();
      }
      // A negative limit walks backwards, so occurrences are returned most recent first.
      return interval.take(-steps).map((occurrence) => occurrence.toDate());
    },
  });
}

function describe({ expression, locale, verbose, use24HourTimeFormat }) {
  // A label can describe a schedule that has not been set yet.
  if (type.isNone(expression) || isBlankString(expression)) {
    return '';
  }
  // Only describe expressions that _cron.validate accepts, cronstrue accepts a wider grammar.
  evaluateExpression({ method: 'describe', expression, options: {}, evaluate: () => true });
  const options = { throwExceptionOnParseError: true };
  // Locales set their own time format, so only override what the config asks for.
  if (!type.isNone(locale)) {
    options.locale = getLocale({ locale });
  }
  if (!type.isNone(verbose)) {
    options.verbose = verbose;
  }
  if (!type.isNone(use24HourTimeFormat)) {
    options.use24HourTimeFormat = use24HourTimeFormat;
  }
  try {
    return cronstrue.toString(DESCRIBE_ALIASES[expression] ?? expression, options);
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

function validate({ expression }) {
  try {
    return evaluateExpression({
      method: 'validate',
      expression,
      options: {},
      evaluate: () => true,
    });
  } catch {
    return false;
  }
}

function fields({ expression }) {
  return evaluateExpression({
    method: 'fields',
    expression,
    options: {},
    evaluate: (interval) => interval.fields.serialize(),
  });
}

const meta = {
  // next and previous default to the current time, so they may not be resolved at build time.
  next: { singleArg: true, validTypes: ['string', 'object'], dynamic: true, prep: readParams },
  previous: { singleArg: true, validTypes: ['string', 'object'], dynamic: true, prep: readParams },
  describe: {
    singleArg: true,
    validTypes: ['string', 'object', 'null', 'undefined'],
    prep: readParams,
  },
  // validate returns false for any input that is not a valid cron expression, so it takes any type.
  validate: { singleArg: true, prep: readParams },
  fields: { singleArg: true, validTypes: ['string', 'object'], prep: readParams },
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
// next and previous count from the current time unless given a "from" date.
_cron.tracking = ({ methodName, params }) => {
  const method = methodName ?? params;
  if (method !== 'next' && method !== 'previous') {
    return { kind: 'pure' };
  }
  const from = type.isObject(params) ? params.from : undefined;
  return { kind: type.isNone(from) ? 'volatile' : 'pure' };
};
_cron.meta = meta;

export default _cron;
