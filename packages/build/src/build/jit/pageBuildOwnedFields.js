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

// The context fields one JIT page build owns. Every other field of a page
// build's context is the kept context's own value, shared by reference.
const pageBuildOwnedFields = [
  'errors',
  'warnings',
  'typeCounters',
  'pageTypeCounters',
  'linkActionRefs',
  'callApiActionRefs',
  'websocketActionRefs',
  'dynamicBlockRefs',
  'orgClientActionRefs',
  'modules',
  'deferred',
  'handleError',
  'handleWarning',
];

export default pageBuildOwnedFields;
