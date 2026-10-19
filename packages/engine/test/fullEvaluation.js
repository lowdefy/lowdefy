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

import DependencyTracker from '../src/tracking/DependencyTracker.js';

// test:full runs the whole engine suite with dependency tracking off, so every update is a full
// pass, the engine's behaviour before tracking. The default run has tracking on.
DependencyTracker.enabled = false;
