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

import generateImportFile from './generateImportFile.js';

async function writeAuthImports({ components, context }) {
  await context.writeBuildArtifact(
    'plugins/auth/adapters.js',
    generateImportFile({
      imports: components.imports.auth.adapters,
      importPath: 'auth/adapters',
    })
  );
  await context.writeBuildArtifact(
    'plugins/auth/callbacks.js',
    generateImportFile({
      imports: components.imports.auth.callbacks,
      importPath: 'auth/callbacks',
    })
  );
  await context.writeBuildArtifact(
    'plugins/auth/events.js',
    generateImportFile({
      imports: components.imports.auth.events,
      importPath: 'auth/events',
    })
  );
  await context.writeBuildArtifact(
    'plugins/auth/providers.js',
    generateImportFile({
      imports: components.imports.auth.providers,
      importPath: 'auth/providers',
    })
  );
}

export default writeAuthImports;
