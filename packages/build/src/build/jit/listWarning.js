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

import serializeBuildException from '../../utils/serializeBuildException.js';

// A warning as the build status lists it, with the key handleWarning lists it
// by: a config build lists one warning for each key, so an endpoint rebuilt
// alone must not list again what another endpoint's build listed.
function listWarning(warning) {
  return {
    listKey: warning.dedupKey ?? warning.source ?? warning.message,
    warning: serializeBuildException(warning),
  };
}

export default listWarning;
