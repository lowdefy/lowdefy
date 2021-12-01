/*
  Copyright 2020-2021 Lowdefy, Inc

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

// TODO: Send keep-alive comment event: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#examples

import chokidar from 'chokidar';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');

  const watcher = chokidar.watch(['./build/tick.json'], {
    ignored: [
      /(^|[/\\])\../, // ignore dotfiles
    ],
    persistent: true,
    ignoreInitial: true,
  });

  const reload = () => {
    try {
      console.log('reload');
      res.write(`event: tick\ndata: ${JSON.stringify({ hello: true })}\n\n`);
    } catch (e) {
      console.log(e);
    }
  };
  watcher.on('add', () => reload());
  watcher.on('change', () => reload());
  watcher.on('unlink', () => reload());

  // TODO: This isn't working.
  req.on('close', () => {
    console.log('req closed');
    watcher.close().then(() => {
      console.log('watcher closed');
    });
  });

  await sleep(7000);
};

export default handler;
