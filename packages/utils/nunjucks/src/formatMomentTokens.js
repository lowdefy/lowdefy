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

// The date filter formatted with moment before it moved to dayjs, so templates use moment's
// tokens. dayjs and its plugins cover most of them; this replaces the rest with their moment
// output, as escaped text, before dayjs formats the string. It works on the format string
// rather than as a dayjs plugin because dayjs is shared with the app (the _dayjs operator,
// blocks), and a plugin would change what those tokens mean there too.
//
// Tokens dayjs handles are matched and passed through unchanged, so a token is never split
// into shorter ones: "DDDD" stays day of year, "LTS" keeps its "S".
const tokenPattern =
  /\[[^\]]*]|LTS|LT|Mo|M{1,4}|Qo|Q|DDDo|DDDD|DDD|Do|DD?|do|d{1,4}|e|E|wo|ww?|Wo|WW?|YYYYYY|YYYY|YY|Y|yo|y|N{1,5}|gggg|gg|GGGG|GG|S{1,9}|zz?/g;

// moment's English eras, which every moment locale but Japanese uses.
const eras = {
  AD: { abbr: 'AD', name: 'Anno Domini' },
  BC: { abbr: 'BC', name: 'Before Christ' },
};

function escape(text) {
  if (text === '') return '';
  return `[${text}]`;
}

function zeroFill(number, length, forceSign = false) {
  const digits = String(Math.abs(number)).padStart(length, '0');
  if (number < 0) return `-${digits}`;
  if (forceSign) return `+${digits}`;
  return digits;
}

function formatMomentTokens({ date, format }) {
  const locale = date.$locale();
  const year = date.year();
  const era = year > 0 ? eras.AD : eras.BC;
  const eraYear = year > 0 ? year : 1 - year;
  return format.replace(tokenPattern, (match) => {
    if (match.startsWith('N')) {
      return escape(match === 'NNNN' ? era.name : era.abbr);
    }
    if (match.startsWith('S')) {
      const milliseconds = zeroFill(date.millisecond(), 3);
      return escape(milliseconds.padEnd(match.length, '0').slice(0, match.length));
    }
    switch (match) {
      case 'Mo':
        return locale.ordinal(date.month() + 1, 'M');
      case 'Qo':
        return locale.ordinal(Math.ceil((date.month() + 1) / 3), 'Q');
      case 'DDD':
        return escape(String(date.dayOfYear()));
      case 'DDDD':
        return escape(zeroFill(date.dayOfYear(), 3));
      case 'DDDo':
        return locale.ordinal(date.dayOfYear(), 'DDD');
      case 'do':
        return locale.ordinal(date.day(), 'd');
      case 'e':
        return escape(String(date.weekday()));
      case 'E':
        return escape(String(date.isoWeekday()));
      case 'Wo':
        return locale.ordinal(date.isoWeek(), 'W');
      case 'YYYYYY':
        return escape(zeroFill(year, 6, true));
      case 'Y':
        return escape(year <= 9999 ? zeroFill(year, 4) : `+${year}`);
      case 'y':
        return escape(String(eraYear));
      case 'yo':
        return locale.ordinal(eraYear, 'y');
      case 'gg':
        return escape(zeroFill(date.weekYear() % 100, 2));
      case 'GG':
        return escape(zeroFill(date.isoWeekYear() % 100, 2));
      case 'z':
        return escape(date.isUTC() ? 'UTC' : '');
      case 'zz':
        return escape(date.isUTC() ? 'Coordinated Universal Time' : '');
      default:
        return match;
    }
  });
}

export default formatMomentTokens;
