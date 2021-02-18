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
import chokidar from 'chokidar';
import BatchChanges from '../../utils/BatchChanges';
import getConfig from '../../utils/getConfig';

function versionWatcher({ context }) {
  const changeLowdefyFileCallback = async () => {
    const { lowdefyVersion } = await getConfig(context);
    if (lowdefyVersion !== context.lowdefyVersion) {
      context.print.warn('Lowdefy version changed. You should restart your development server.');
      process.exit();
    }
  };
  const changeLowdefyFileBatchChanges = new BatchChanges({
    fn: changeLowdefyFileCallback,
    context,
  });
  const lowdefyFileWatcher = chokidar.watch('./lowdefy.yaml', {
    persistent: true,
  });
  lowdefyFileWatcher.on('change', () => changeLowdefyFileBatchChanges.newChange());
}

export default versionWatcher;
