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

import generateImportFile from './generateImportFile.js';

async function writeNotificationImports({ components, context }) {
  const registry = generateImportFile({
    imports: components.imports.notifications,
    importPath: 'notifications',
  });

  // The servers statically import renderEmail and interpolateProperties from this
  // file, so both named exports must always exist. Apps with notifications get
  // the real implementations; apps without notifications never install
  // @lowdefy/email-templates, so the exports are undefined placeholders.
  const helperExports =
    (components.notifications ?? []).length > 0
      ? `export { renderEmail, interpolateProperties } from '@lowdefy/email-templates';`
      : `export const renderEmail = undefined;
export const interpolateProperties = undefined;`;

  await context.writeBuildArtifact(
    'plugins/notifications.js',
    `${registry}
${helperExports}
`
  );
}

export default writeNotificationImports;
