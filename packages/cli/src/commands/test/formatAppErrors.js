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

// One line per app error a journey failure carries: its kind, its message and
// the config file and line it came from, when known.
function formatAppErrors({ errors }) {
  return (errors ?? []).map((error) => {
    const parts = [error.kind, error.message];
    if (!type.isNone(error.source)) {
      parts.push(error.source);
    }
    return `      ${parts.join('  ')}`;
  });
}

export default formatAppErrors;
