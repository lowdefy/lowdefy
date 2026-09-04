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

import toOtlpAnyValue from './toOtlpAnyValue.js';

// pino levels are the numbers 10..60; OTLP severity numbers are 1..24 in bands
// of four. The mapping is the one the OpenTelemetry log data model documents
// for these level names.
const severities = {
  10: { number: 1, text: 'TRACE' },
  20: { number: 5, text: 'DEBUG' },
  30: { number: 9, text: 'INFO' },
  40: { number: 13, text: 'WARN' },
  50: { number: 17, text: 'ERROR' },
  60: { number: 21, text: 'FATAL' },
};

// `time`, `level` and `msg` become the record's own fields; everything else the
// app put on the line is an attribute. Resource-level fields (app_name,
// git_sha, ...) are carried once per batch on the resource, so they are dropped
// from the per-record attributes rather than repeated on every line.
function toOtlpLogRecord({ line, resourceKeys = [] }) {
  const { time, level, msg, ...rest } = line;
  const severity = severities[level] ?? { number: 0, text: 'UNSPECIFIED' };
  const record = {
    // Nanoseconds since the epoch exceeds Number.MAX_SAFE_INTEGER, and OTLP/JSON
    // carries it as a string - so the millisecond timestamp gains six zeros
    // rather than being multiplied.
    timeUnixNano: `${type.isInt(time) ? time : Date.now()}000000`,
    severityNumber: severity.number,
    severityText: severity.text,
    attributes: Object.keys(rest)
      .filter((key) => !resourceKeys.includes(key))
      .map((key) => ({ key, value: toOtlpAnyValue(rest[key]) })),
  };
  if (!type.isNone(msg)) {
    record.body = { stringValue: msg };
  }
  return record;
}

export default toOtlpLogRecord;
