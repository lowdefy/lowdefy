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

import describeDatabaseTarget from './describeDatabaseTarget.js';

// The key a data session gives each database target its own database by, or null when the target
// is computed per request.
function describeTargetKey({ properties }) {
  const target = describeDatabaseTarget({ properties });
  if (type.isNone(target)) return null;
  return JSON.stringify([target.uri, target.databaseName]);
}

export default describeTargetKey;
