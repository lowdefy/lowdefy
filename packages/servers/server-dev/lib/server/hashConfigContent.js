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

import crypto from 'node:crypto';

// The hash a page build record keeps for a config file's content, as
// readConfigFile returned it: 'missing' for a file that does not exist.
function hashConfigContent(content) {
  if (content === null) return 'missing';
  return crypto.createHash('sha256').update(content).digest('hex');
}

export default hashConfigContent;
