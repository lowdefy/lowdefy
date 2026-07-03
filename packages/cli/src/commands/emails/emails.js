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

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyBuild from '../../utils/runLowdefyBuild.js';

import generateEmailShims from './generateEmailShims.js';
import readNotificationArtifacts from './readNotificationArtifacts.js';
import runEmailPreview from './runEmailPreview.js';
import warnMissingDataKeys from './warnMissingDataKeys.js';

async function emails({ context }) {
  context.logger.info('Building app for email preview.');

  const directory = context.directories.server;

  // The lowdefy build pipeline minus the client build — guarantees
  // build/notifications/*.json exists and the second install has installed
  // react-email, @lowdefy/email-templates and any custom template plugins.
  await getServer({ context, packageName: '@lowdefy/server', directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await installServer({ context, directory });
  await runLowdefyBuild({ context, directory });
  await installServer({ context, directory });

  const { notifications, appEmail, notificationTypes } = await readNotificationArtifacts({
    context,
  });
  if (notifications.length === 0) {
    context.logger.warn(
      'No notifications configured. Add a "notifications:" section to preview emails.'
    );
    return;
  }

  await generateEmailShims({ context, notifications, appEmail, notificationTypes });
  await warnMissingDataKeys({ context, notifications, notificationTypes });
  context.logger.info(
    'Preview shims generated. Config changes (properties, testData) need a rerun of "lowdefy emails"; template code changes hot-reload.'
  );

  await context.sendTelemetry();
  await runEmailPreview({ context });
}

export default emails;
