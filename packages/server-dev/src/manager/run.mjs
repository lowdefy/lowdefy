#!/usr/bin/env node
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

import opener from 'opener';
import getContext from './getContext.mjs';
import initialBuild from './initialBuild.mjs';
import startServer from './processes/startServer.mjs';
import startWatchers from './watchers/startWatchers.mjs';
import wait from './wait.mjs';

async function run() {
  const context = await getContext();
  await initialBuild(context);
  await startWatchers(context);
  try {
    const serverPromise = startServer(context);
    await wait(800);
    // TODO: set correct port
    opener(`http://localhost:3000`);
    await serverPromise;
  } catch (error) {
    context.shutdownServer();
    throw error;
  }
}

run();
