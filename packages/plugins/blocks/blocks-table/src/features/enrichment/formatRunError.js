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

const MAX_MESSAGE = 120;
const FALLBACK = 'The run failed.';

// Cuts a long message at a word boundary, so the cell's tooltip stays a summary; the details
// panel shows the whole message.
function shorten(message) {
  if (message.length <= MAX_MESSAGE) return message;
  const cut = message.slice(0, MAX_MESSAGE - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > MAX_MESSAGE / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

// What an error cell's tooltip says: `summary`, "Failed after <n> attempts" when the queue
// retried (or "Failed"), and `message`, the stored error shortened. The error is written by
// the app's worker and provider endpoints, which store messages users can read ("Provider
// error (500)"), never a connection's internal error.
function formatRunError(state) {
  const attempts = state?.attempts;
  const summary =
    type.isNumber(attempts) && attempts > 1 ? `Failed after ${attempts} attempts` : 'Failed';
  const error = type.isString(state?.error) && state.error.trim() !== '' ? state.error : FALLBACK;
  return { summary, message: shorten(error.trim()) };
}

export default formatRunError;
