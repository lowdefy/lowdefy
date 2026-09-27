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

import startServer from './startServer.mjs';
import waitForServer from '../utils/waitForServer.mjs';

// Resolves once the new server answers, and counts as build activity until
// then, so lowdefy_build_status({ wait: true }) waits through a restart
// instead of answering before it and leaving the next call to hit it.
function restartServer(context) {
  return () =>
    context.buildActivity.track(async () => {
      context.shutdownServer();
      context.logger.info({ spin: 'start' }, 'Restarting server...');
      startServer(context);
      const ready = await waitForServer({
        basePath: context.basePath,
        child: context.devServer,
        port: context.internalPort,
      });
      if (ready) {
        context.logger.info({ spin: 'succeed' }, 'Restarted server.');
        return;
      }
      context.logger.warn('The restarted dev server did not answer - check the output above.');
    });
}

export default restartServer;
