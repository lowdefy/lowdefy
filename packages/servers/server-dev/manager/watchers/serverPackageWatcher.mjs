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

import path from 'path';
import setupWatcher from '../utils/setupWatcher.mjs';

// A page build in the dev server that finds a plugin package missing adds it
// to the server's package.json (the page answers "installing"). Installing it,
// rebuilding and restarting is syncServer's work, as it is after a config
// build that adds one. Config builds sync the server themselves, so this
// watcher only has work when the change came from the dev server.
function serverPackageWatcher(context) {
  const callback = async () => {
    await context.syncServer();
  };
  return setupWatcher({
    callback,
    context,
    onBusy: context.buildActivity.setBusy,
    watchDotfiles: true,
    watchPaths: [path.join(context.directories.server, 'package.json')],
  });
}

export default serverPackageWatcher;
