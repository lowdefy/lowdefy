/*
  Copyright 2020-2024 Lowdefy, Inc

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

import fs from 'fs';
import path from 'path';

async function handler(req, res) {
  const { env } = req.query;

  if (env !== 'client' && env !== 'server') {
    res.status(400).send('Invalid env parameter. Use "client" or "server".');
    return;
  }

  const fileName = env === 'client' ? 'clientJsMap.js' : 'serverJsMap.js';
  const filePath = path.join(process.cwd(), 'build', 'plugins', 'operators', fileName);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(content);
  } catch {
    // Return empty default export if file doesn't exist yet
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send('export default {};');
  }
}

export default handler;
