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
/* eslint-disable no-console */

import getLowdefyVersion from '../utils/getLowdefyVersion.mjs';
import setupWatcher from '../utils/setupWatcher.mjs';

async function configWatcher(context) {
  const callback = async (filePaths) => {
    const lowdefyYamlModified = filePaths
      .flat()
      .some((filePath) => filePath.includes('lowdefy.yaml') || filePath.includes('lowdefy.yml'));
    if (lowdefyYamlModified) {
      const lowdefyVersion = await getLowdefyVersion(context);
      if (lowdefyVersion !== context.version) {
        console.warn('Lowdefy version changed. You should restart your development server.');
        process.exit();
      }
    }

    await context.lowdefyBuild();
    context.reloadClients();
  };
  // TODO: Add ignored and watch paths
  return setupWatcher({ callback, watchPaths: [context.directories.config] });
}

export default configWatcher;
