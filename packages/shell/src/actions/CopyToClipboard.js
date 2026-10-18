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

// The native body of actions-core's CopyToClipboard, with its params ({ copy }), through
// expo-clipboard (globals.clipboard).
async function CopyToClipboard({ globals, params }) {
  const { copy } = params;
  if (!type.isString(copy)) {
    throw new Error(`CopyToClipboard requires "copy" text. Received ${JSON.stringify(copy)}.`);
  }
  await globals.clipboard.setString(copy);
}

export default CopyToClipboard;
