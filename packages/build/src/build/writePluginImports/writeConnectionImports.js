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

import { ConfigWarning, LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import filePluginImportSpecifier from '../filePlugins/filePluginImportSpecifier.js';
import findFilePlugin from '../filePlugins/findFilePlugin.js';

const ARTIFACT_PATH = 'plugins/connections.js';

// The connection barrel is the one barrel whose entries are not the imported
// type itself: a connection carries a map of request resolvers. A package
// assembles that map in its own connections barrel; a file plugin has no
// barrel, so the build assembles it here from the discovered request files -
// the author never wires a request up twice.
const FILE_PLUGIN_HELPERS = `
function filePluginConnection(connection, declared, requests) {
  return { ...connection, ...declared, requests: { ...connection.requests, ...requests } };
}

// checkRead and checkWrite gate a request against the connection's read and
// write properties. A request that declares neither is gated on both, so a
// file plugin can never widen a connection by staying silent.
function filePluginRequest(request, declared) {
  return Object.assign(request, {
    ...declared,
    meta: { checkRead: true, checkWrite: true, ...request.meta, ...declared.meta },
  });
}

`;

// The schema and meta a file plugin declares in its sibling JSON. The build
// never imports the plugin's source, so what the JSON declares is stamped onto
// the module's own statics in the generated barrel instead.
function declaredStatics({ meta, schema }) {
  return JSON.stringify({ meta, schema });
}

function warnUndeclaredGates({ context, record }) {
  if (type.isBoolean(record.meta?.checkRead) && type.isBoolean(record.meta?.checkWrite)) {
    return;
  }
  const jsonPath = record.relativePath.replace(/\.js$/, '.json');
  context.handleWarning(
    new ConfigWarning(
      `Request file plugin "${record.relativePath}" does not declare its connection gates, so both are enforced. Declare them in "${jsonPath}" as { "meta": { "checkRead": true, "checkWrite": false } }.`,
      { filePath: record.relativePath, lineNumber: 1, checkSlug: 'request-types' }
    )
  );
}

function fileConnectionImport({ context, typeName }) {
  const record = findFilePlugin({ context, kind: 'connections', typeName });
  if (type.isNone(record)) {
    // Every type with no package is a discovered file plugin: buildImports
    // reads the same typesMap discovery wrote into.
    throw new LowdefyInternalError(
      `No file plugin was discovered for connections type "${typeName}".`
    );
  }
  const requests = (context.filePlugins ?? [])
    .filter((request) => request.kind === 'requests' && request.connectionType === typeName)
    .map((request) => {
      warnUndeclaredGates({ context, record: request });
      return {
        localName: `${typeName}_${request.typeName}`,
        specifier: filePluginImportSpecifier({
          artifactPath: ARTIFACT_PATH,
          context,
          record: request,
        }),
        statics: declaredStatics(request),
        typeName: request.typeName,
      };
    });
  return {
    localName: typeName,
    requests,
    specifier: filePluginImportSpecifier({ artifactPath: ARTIFACT_PATH, context, record }),
    statics: declaredStatics(record),
    typeName,
  };
}

function importLines(connections) {
  return connections
    .map((connection) => {
      if (type.isNone(connection.filePlugin)) {
        return `import { ${connection.originalTypeName} as ${connection.typeName} } from '${connection.package}/connections';\n`;
      }
      const { localName, requests, specifier } = connection.filePlugin;
      return [
        `import ${localName} from '${specifier}';\n`,
        ...requests.map((request) => `import ${request.localName} from '${request.specifier}';\n`),
      ].join('');
    })
    .join('');
}

function entryLines(connections) {
  return connections
    .map((connection) => {
      if (type.isNone(connection.filePlugin)) {
        return `${connection.typeName},\n  `;
      }
      const { localName, requests, statics, typeName } = connection.filePlugin;
      const requestEntries = requests
        .map(
          (request) =>
            `${request.typeName}: filePluginRequest(${request.localName}, ${request.statics})`
        )
        .join(', ');
      return `${typeName}: filePluginConnection(${localName}, ${statics}, { ${requestEntries} }),\n  `;
    })
    .join('');
}

async function writeConnectionImports({ components, context }) {
  const connections = (components.imports.connections ?? []).map((connection) => {
    if (!type.isNone(connection.package)) {
      return connection;
    }
    return {
      ...connection,
      filePlugin: fileConnectionImport({ context, typeName: connection.typeName }),
    };
  });
  const hasFilePlugin = connections.some((connection) => !type.isNone(connection.filePlugin));
  const helpers = hasFilePlugin ? FILE_PLUGIN_HELPERS : '';

  await context.writeBuildArtifact(
    ARTIFACT_PATH,
    `${importLines(connections)}${helpers}export default {\n  ${entryLines(connections)}};`
  );
}

export default writeConnectionImports;
