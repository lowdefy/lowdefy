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

// The native types of the app's shell plugins (shell.json `plugins`), which src/plugins/types.js
// registers after the built-in types. The shell package ships it empty; `lowdefy mobile config`
// rewrites it in the copied shell to import each plugin's `./native`, with its typePrefix applied:
//
//   import * as plugin0 from '@example/lowdefy-printer/native';
//   import prefixTypes from './prefixTypes.js';
//
//   export default {
//     actions: { ...prefixTypes({ types: plugin0.actions, typePrefix: 'Printer' }) },
//     blocks: { ...prefixTypes({ types: plugin0.blocks, typePrefix: 'Printer' }) },
//   };
export default { actions: {}, blocks: {} };
