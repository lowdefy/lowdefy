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

import serveBuildJs from '../lib/serveBuildJs.js';

function jsEnvHandler(c) {
  const env = c.req.param('env');
  if (env !== 'client' && env !== 'server') {
    return c.text('Invalid env parameter. Use "client" or "server".', 400);
  }
  const fileName = env === 'client' ? 'clientJsMap.js' : 'serverJsMap.js';
  return c.body(serveBuildJs(['plugins', 'operators', fileName]), 200, {
    'Content-Type': 'application/javascript',
  });
}

export default jsEnvHandler;
