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

import fs from 'fs';
import path from 'path';

async function readNotificationArtifacts({ context }) {
  const buildDirectory = context.directories.build;
  const notificationsDirectory = path.join(buildDirectory, 'notifications');

  let notifications = [];
  if (fs.existsSync(notificationsDirectory)) {
    const files = await fs.promises.readdir(notificationsDirectory);
    notifications = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) =>
          JSON.parse(await fs.promises.readFile(path.join(notificationsDirectory, file), 'utf8'))
        )
    );
  }

  const app = JSON.parse(
    await fs.promises.readFile(path.join(buildDirectory, 'app.json'), 'utf8')
  );
  const types = JSON.parse(
    await fs.promises.readFile(path.join(buildDirectory, 'types.json'), 'utf8')
  );

  return {
    notifications,
    appEmail: app.email ?? {},
    notificationTypes: types.notifications ?? {},
  };
}

export default readNotificationArtifacts;
