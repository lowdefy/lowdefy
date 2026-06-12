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

// Factory scope (design D1): ref vars, the bound module registration, the
// caller's provenance key, and the inclusion chain for dynamic-cycle
// detection. `importer` maps a config path to its compiled module (dynamic
// refs); `onError` collects ConfigErrors the way the walker's collectError
// does — when absent, errors throw.
function createScope({
  vars = {},
  module = null,
  importer = null,
  file = null,
  callSite = null,
  refChain = [],
  onError = null,
  env = process.env,
  refId = null,
  sourceRefId = null,
  // Walker-parity instance tracking (markers mode): walkPath is the global
  // tree path this file's content is rooted at (paths continue through ref
  // boundaries), and refTracker allocates instance ref ids and registers
  // refMap entries — injected by the build, which owns the id counter.
  walkPath = '',
  refTracker = null,
} = {}) {
  return {
    vars,
    module,
    importer,
    file,
    callSite,
    refChain,
    onError,
    env,
    refId,
    sourceRefId,
    walkPath,
    refTracker,
  };
}

export default createScope;
