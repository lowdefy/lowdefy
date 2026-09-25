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

import { ConfigWarning } from '@lowdefy/errors';

import findSimilarString from '../../utils/findSimilarString.js';

function createUnknownDataIconWarning({ aliases, name }) {
  let message = `data-icon="${name}" is not an icon alias or a react-icons name.`;
  const suggestion = findSimilarString({ input: name, candidates: Object.keys(aliases) });
  if (suggestion) {
    message += ` Did you mean "${suggestion}"?`;
  }
  return new ConfigWarning(message, { checkSlug: 'icons' });
}

export default createUnknownDataIconWarning;
