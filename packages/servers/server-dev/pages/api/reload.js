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

import chokidar from 'chokidar';

const handler = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');

  const watcher = chokidar.watch(['./build/reload'], {
    persistent: true,
    ignoreInitial: true,
  });

  const reload = () => {
    try {
      res.write(`event: reload\ndata: ${JSON.stringify({})}\n\n`);
    } catch (e) {
      console.error(e);
    }
  };
  watcher.on('add', () => reload());
  watcher.on('change', () => reload());
  // Do not reload on unlink — cleanBuildDirectory deletes build/reload during
  // skeleton rebuilds, which would send a premature SSE event before the new
  // build artifacts are written. The real reload comes via add/change when
  // reloadClients() creates the file after the build completes.

  // TODO: This isn't working.
  req.on('close', () => {
    console.log('req closed');
    watcher.close().then(() => {
      console.log('watcher closed');
    });
  });
};

export default handler;
