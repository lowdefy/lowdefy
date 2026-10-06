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

import { isMountEventName, type } from '@lowdefy/helpers';

import compileRecord from '../journeyCompiler/compileRecord.js';
import describeLogOutcome from './describeLogOutcome.js';
import describeLogStep from './describeLogStep.js';
import describeLogValue from './describeLogValue.js';

function withOutcome({ line, record }) {
  const outcome = describeLogOutcome({ record });
  return outcome === '' ? line : `${line} → ${outcome}`;
}

function describePageview({ record }) {
  if (!type.isString(record.url) || record.url === `/${record.page_id}`) {
    return `page ${record.page_id}`;
  }
  return `page ${record.page_id} ${record.url}`;
}

// Mount and app events run on every page load; they are worth a line only
// when they did something the reader needs (a request, a failure).
function describeEngine({ record }) {
  const { event } = record;
  const line = record.scope === 'app' ? `app ${event.name}` : `${event.name} on ${event.block_id}`;
  const outcome = describeLogOutcome({ record });
  const quiet = record.scope === 'app' || isMountEventName({ eventName: event.name });
  if (quiet && outcome === '') return undefined;
  return outcome === '' ? line : `${line} → ${outcome}`;
}

// An interaction no journey verb can drive (a date picker, a control known
// neither by block nor by text) still happened: the log says what it was and
// why no step can replay it.
function describeUndrivable({ record, flag }) {
  const { target } = record;
  const parts = [record.kind];
  if (!type.isNone(target?.block_id)) parts.push(target.block_id);
  if (!type.isNone(target?.text)) parts.push(JSON.stringify(target.text));
  if ('value' in record) parts.push(describeLogValue(record.value));
  const why =
    flag === 'manual-input'
      ? `no journey verb drives ${target?.block_type ?? 'this input'}`
      : 'control known neither by block nor by text';
  return `${parts.join(' ')} (${why})`;
}

function describeInteraction({ record, blockMetas }) {
  const { steps, flags } = compileRecord({ record, blockMetas });
  const undrivable = flags.find((flag) => ['manual-input', 'unresolved-target'].includes(flag));
  let line;
  if (!type.isUndefined(undrivable)) {
    line = describeUndrivable({ record, flag: undrivable });
  } else if (steps.length > 0) {
    line = describeLogStep({ step: steps[0], record });
  }
  // A printable character typed into a field is part of its change record.
  if (type.isUndefined(line)) return undefined;
  if (flags.includes('tokenised-text')) line = `${line} (text not in config)`;
  if (!type.isNone(record.frustration)) line = `${line} (${record.frustration} click)`;
  return withOutcome({ line, record });
}

// One folded trace record as a line of the session log, or undefined when the
// record says nothing a reader needs.
function describeLogRecord({ record, blockMetas }) {
  switch (record.kind) {
    case 'pageview':
      return describePageview({ record });
    case 'back':
      return 'back';
    case 'engine':
      return describeEngine({ record });
    case 'click':
    case 'change':
    case 'key':
      return describeInteraction({ record, blockMetas });
    default:
      return undefined;
  }
}

export default describeLogRecord;
