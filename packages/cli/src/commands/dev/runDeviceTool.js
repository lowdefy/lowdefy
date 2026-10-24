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

import { runDeviceTool } from '@lowdefy/node-utils';

// The runner every device step of `lowdefy dev` uses (and passes to the shared
// device helpers in @lowdefy/node-utils), in one module so tests stand in for
// all of them at once.
export default runDeviceTool;
