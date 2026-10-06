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

// A record as the compiler may see it: a clicked-text token that is the
// token of a config string sets `target.text` to that string and keeps the
// token; any other token leaves the target without text. No other text from a
// day file reaches a reader.
function resolveRecordText({ record, resolve }) {
  if (!type.isObject(record?.target)) return record;
  const target = { ...record.target };
  delete target.text;
  const resolved = type.isString(target.text_token) ? resolve(target.text_token) : null;
  if (!type.isNone(resolved)) target.text = resolved;
  return { ...record, target };
}

export default resolveRecordText;
