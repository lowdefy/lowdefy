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

import fs from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

async function usageHandler(c) {
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');
  const { user, machine } = await c.req.json();
  const host = c.req.header('host');
  context.logger.info({ event: 'log_usage', user, machine });

  const timestamp = Date.now();

  return c.json({
    offline: false,
    data: {
      gitSha: context.appMeta.gitSha,
      host,
      machine,
      timestamp,
      user,
      version: packageJson.version,
    },
  });
}

export default usageHandler;
