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

// Text treg or a provider sent back can in principle echo a header it received. The token
// is the one value that must never reach an error message or a log, so it is replaced
// wherever it appears.
function redactToken({ text, token }) {
  if (!type.isString(text)) return text;
  if (!type.isString(token) || token.length === 0) return text;
  return text.split(token).join('[redacted]');
}

export default redactToken;
