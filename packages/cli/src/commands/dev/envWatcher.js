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
import BatchChanges from '../../utils/BatchChanges.js';

function envWatcher({ context }) {
  const changeEnvCallback = async () => {
    context.print.warn('.env file changed. You should restart your development server.');
    process.exit();
  };
  const changeEnvBatchChanges = new BatchChanges({ fn: changeEnvCallback, context });
  const envFileWatcher = chokidar.watch('./.env', {
    persistent: true,
  });
  envFileWatcher.on('change', () => changeEnvBatchChanges.newChange());
}

export default envWatcher;
