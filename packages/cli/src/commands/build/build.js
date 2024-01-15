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

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyBuild from '../../utils/runLowdefyBuild.js';
import runNextBuild from '../../utils/runNextBuild.js';

async function build({ context }) {
  context.print.info('Starting build.');

  const directory = context.directories.server;

  let packageName = '@lowdefy/server-community';

  if (!context.options.communityEdition) {
    packageName = '@lowdefy/server-enterprise';
  }

  await getServer({ context, packageName, directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await installServer({ context, directory });
  await runLowdefyBuild({ context, directory });
  await installServer({ context, directory });
  if (context.options.nextBuild !== false) {
    await runNextBuild({ context, directory });
  }
  await context.sendTelemetry({ sendTypes: true });
  context.print.succeed(`Build successful.`);
}

export default build;
