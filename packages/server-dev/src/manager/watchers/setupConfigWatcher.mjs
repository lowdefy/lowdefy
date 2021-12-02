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

import runLowdefyBuild from '../runLowdefyBuild.mjs';
import setupWatcher from './setupWatcher.mjs';

async function setupConfigWatcher(context) {
  const callback = async () => {
    console.log('Running build');
    await runLowdefyBuild(context);
  };
  return setupWatcher({ callback, watchPaths: [context.directories.config] });
}

export default setupConfigWatcher;
