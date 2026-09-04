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

import { PLUGIN_API_VERSION } from '@lowdefy/block-utils';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import collectExceptions from '../../utils/collectExceptions.js';
import readPluginPackageJson from './readPluginPackageJson.js';

const MIGRATION_DOC = 'https://docs.lowdefy.com/plugin-api-versioning';

// Every package that contributes a type this app uses, in a stable order.
function pluginPackageNames({ components }) {
  const { actions, blocks, connections, operators } = components.imports;
  return [
    ...new Set(
      [
        ...(blocks ?? []),
        ...(actions ?? []),
        ...(connections ?? []),
        ...(operators?.client ?? []),
        ...(operators?.server ?? []),
      ].map((imported) => imported.package)
    ),
  ].sort();
}

// A file plugin has no package.json, so it declares the version in its sibling
// JSON, and declaring nothing means the version this framework implements: the
// file lives in the app it is built with, so it cannot predate the field the
// way a published third-party package can.
function validateFilePluginApiVersions({ context }) {
  const reported = new Set();
  for (const record of context.filePlugins ?? []) {
    const declared = record.pluginApiVersion;
    if (type.isUndefined(declared) || reported.has(record.relativePath)) {
      continue;
    }
    reported.add(record.relativePath);
    if (declared === PLUGIN_API_VERSION) {
      continue;
    }
    collectExceptions(
      context,
      new ConfigError(
        `File plugin "${record.relativePath}" was built for plugin API v${JSON.stringify(
          declared
        )}, but this Lowdefy version implements v${PLUGIN_API_VERSION}. Upgrade the plugin, or pin a Lowdefy version that implements v${JSON.stringify(
          declared
        )}. See ${MIGRATION_DOC}.`,
        {
          received: { filePlugin: record.relativePath, pluginApiVersion: declared },
          filePath: record.relativePath,
          lineNumber: 1,
          checkSlug: 'plugin-api-version',
        }
      )
    );
  }
}

// Compares each plugin package's declared lowdefy.pluginApiVersion against the version this
// framework implements. A package built against a different major of the plugin API renders or
// runs wrongly rather than not at all, so it is a build error naming the migration doc. A package
// that declares nothing is a warning, not an error, for one release: the field is new and every
// third-party plugin predates it.
function validatePluginApiVersions({ components, context }) {
  validateFilePluginApiVersions({ context });
  for (const packageName of pluginPackageNames({ components })) {
    const packageJson = readPluginPackageJson({ context, packageName });
    if (type.isNone(packageJson)) {
      continue;
    }
    const declared = packageJson.lowdefy?.pluginApiVersion;
    if (type.isUndefined(declared)) {
      context.handleWarning(
        new ConfigWarning(
          `Plugin package "${packageName}" does not declare a plugin API version. Add { "lowdefy": { "pluginApiVersion": ${PLUGIN_API_VERSION} } } to its package.json. See ${MIGRATION_DOC}.`,
          { received: packageName }
        )
      );
      continue;
    }
    if (declared !== PLUGIN_API_VERSION) {
      collectExceptions(
        context,
        new ConfigError(
          `Plugin package "${packageName}" was built for plugin API v${JSON.stringify(
            declared
          )}, but this Lowdefy version implements v${PLUGIN_API_VERSION}. Upgrade the plugin, or pin a Lowdefy version that implements v${JSON.stringify(
            declared
          )}. See ${MIGRATION_DOC}.`,
          {
            received: { package: packageName, pluginApiVersion: declared },
            checkSlug: 'plugin-api-version',
          }
        )
      );
    }
  }
}

export default validatePluginApiVersions;
