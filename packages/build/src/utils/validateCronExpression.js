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

// Validates a cron expression against the restricted subset Vercel Cron Jobs accept, so an invalid
// schedule fails at build instead of during the Vercel deployment. Vercel rules:
//   - Exactly 5 fields: minute hour day-of-month month day-of-week.
//   - Numeric values only — named values like MON or JAN are not supported.
//   - Day-of-month and day-of-week are mutually exclusive: when one is set the other must be "*".
// Returns null when valid, otherwise a human-readable reason string.

const FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day-of-month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'day-of-week', min: 0, max: 6 },
];

function validateInt(value, { min, max }) {
  if (!/^[0-9]+$/.test(value)) {
    return `contains non-numeric value "${value}" (named values like MON/JAN are not supported)`;
  }
  const n = Number(value);
  if (n < min || n > max) {
    return `value "${value}" is out of range (${min}-${max})`;
  }
  return null;
}

function validatePart(part, { min, max }) {
  let range = part;
  if (part.includes('/')) {
    const stepSplit = part.split('/');
    if (stepSplit.length !== 2) {
      return `has an invalid step in "${part}"`;
    }
    const [rangePart, stepPart] = stepSplit;
    if (!/^[1-9][0-9]*$/.test(stepPart)) {
      return `has an invalid step in "${part}"`;
    }
    range = rangePart;
  }

  if (range === '*') {
    return null;
  }

  if (range.includes('-')) {
    const rangeSplit = range.split('-');
    if (rangeSplit.length !== 2) {
      return `has an invalid range in "${part}"`;
    }
    const [startStr, endStr] = rangeSplit;
    const startReason = validateInt(startStr, { min, max });
    if (startReason) return startReason;
    const endReason = validateInt(endStr, { min, max });
    if (endReason) return endReason;
    if (Number(startStr) > Number(endStr)) {
      return `has a descending range in "${part}"`;
    }
    return null;
  }

  return validateInt(range, { min, max });
}

function validateField(field, spec) {
  if (field === '') {
    return `${spec.name} field is empty`;
  }
  const parts = field.split(',');
  for (const part of parts) {
    const reason = validatePart(part, spec);
    if (reason) {
      return `${spec.name} field "${field}" ${reason}`;
    }
  }
  return null;
}

function validateCronExpression(expression) {
  if (typeof expression !== 'string') {
    return 'cron expression must be a string';
  }
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    return 'cron expression must have exactly 5 fields (minute hour day-of-month month day-of-week)';
  }
  for (let i = 0; i < FIELDS.length; i += 1) {
    const reason = validateField(fields[i], FIELDS[i]);
    if (reason) return reason;
  }
  const [, , dayOfMonth, , dayOfWeek] = fields;
  if (dayOfMonth !== '*' && dayOfWeek !== '*') {
    return 'cannot specify both day-of-month and day-of-week; one must be "*"';
  }
  return null;
}

export default validateCronExpression;
