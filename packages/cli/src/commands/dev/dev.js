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
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runDevServer from './runDevServer.js';
import getServer from '../../utils/getServer.js';

async function dev({ context }) {
  const directory = context.directories.dev;
  context.print.info('Starting development server.');
  await getServer({ context, packageName: '@lowdefy/server-dev', directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await installServer({ context, directory });
  context.sendTelemetry();
  await runDevServer({ context, directory });
}

export default dev;
