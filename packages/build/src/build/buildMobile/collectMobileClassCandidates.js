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

import getMobileClassCandidates from './getMobileClassCandidates.js';

// The class candidates of mobile and shared pages, kept on the context for
// buildMobileClassMap. Runs before buildJs, which replaces _js source with
// hashes.
function collectMobileClassCandidates({ components, context }) {
  context.mobileClassCandidates = getMobileClassCandidates({ pages: components.pages ?? [] });
  return components;
}

export default collectMobileClassCandidates;
