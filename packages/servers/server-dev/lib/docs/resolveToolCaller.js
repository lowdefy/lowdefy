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

import path from 'node:path';
import { type } from '@lowdefy/helpers';

import readDevAuthMode from './readDevAuthMode.js';
import resolveJourneyDataSet from './dataSets/resolveJourneyDataSet.js';

const SHAPE =
  '"user" should be a user object, e.g. {"roles":["admin"]}, "none" to act signed out, or the name of a user in the data set named by "data".';

// Who a dev tool call acts as, in the forms a journey takes: a user object
// (merged over the roleless headless default), "none" (no injected caller,
// so the app's own auth decides), or the name of a user in the data set
// `data` names. A data set also runs the call on a fresh database of its own,
// loaded with it (see withDataSession). Returns { user, dataSet } - user is
// the object, "none" or undefined; dataSet is undefined without `data` - or
// { error, invalidInput: true } for a caller the call cannot act as.
async function resolveToolCaller({ user, data }) {
  if (!type.isNone(data) && !type.isString(data)) {
    return {
      error: `"data" should be the name of a data set in tests/data/<name>.yaml. Received ${JSON.stringify(
        data
      )}.`,
      invalidInput: true,
    };
  }
  if (!type.isNone(user) && !type.isObject(user) && !type.isString(user)) {
    return { error: `${SHAPE} Received ${JSON.stringify(user)}.`, invalidInput: true };
  }
  if (user === '') {
    return { error: `${SHAPE} Received "".`, invalidInput: true };
  }
  const resolved = await resolveJourneyDataSet({
    data,
    user: user ?? undefined,
    subject: 'call',
    configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd(),
    buildDirectory: path.join(process.cwd(), 'build'),
    ...readDevAuthMode(),
  });
  if (!type.isUndefined(resolved.error)) {
    return { error: resolved.error, invalidInput: true };
  }
  return { user: resolved.user, dataSet: resolved.dataSet };
}

export default resolveToolCaller;
