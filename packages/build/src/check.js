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

import { BuildError } from '@lowdefy/errors';

import build from './index.js';

// The validation phase of the build as a product: what a production build would
// say about this config, without producing one. stage is forced to 'prod' so
// prodError warnings arrive as errors through createHandleWarning.
async function check(options) {
  try {
    return await build({ ...options, stage: 'prod', validateOnly: true });
  } catch (error) {
    if (error instanceof BuildError) {
      return { errors: error.errors ?? [], warnings: error.warnings ?? [] };
    }
    throw error;
  }
}

export default check;
