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
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

// A template documents the data keys it renders (Template.dataKeys). A key
// missing from testData means the preview section renders empty — usually a
// pipeline/template naming mismatch, surfaced here instead of as a silently
// empty email.
async function warnMissingDataKeys({ context, notifications, notificationTypes }) {
  const serverRequire = createRequire(path.join(context.directories.server, 'package.json'));
  const templateModules = {};

  for (const notification of notifications) {
    const typeDefinition = notificationTypes[notification.type];
    if (!typeDefinition) continue;

    try {
      if (!templateModules[typeDefinition.package]) {
        const modulePath = serverRequire.resolve(`${typeDefinition.package}/notifications`);
        templateModules[typeDefinition.package] = await import(pathToFileURL(modulePath));
      }
      const Template = templateModules[typeDefinition.package][typeDefinition.originalTypeName];
      const testDataKeys = Object.keys(notification.testData ?? {});
      (Template?.dataKeys ?? []).forEach((key) => {
        if (!testDataKeys.includes(key)) {
          context.logger.warn(
            `Notification "${notification.notificationId}": template ${notification.type} renders "data.${key}" but testData has no "${key}" key — the preview section will be empty.`
          );
        }
      });
    } catch (error) {
      context.logger.debug(
        `Could not inspect template "${notification.type}" for data keys: ${error.message}`
      );
    }
  }
}

export default warnMissingDataKeys;
