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

import createTestLogger from './createTestLogger.js';

/**
 * Custom types map for testing - includes common types used in fixtures.
 * Contains all basic blocks, loaders, common actions, operators, and connections.
 */
const testTypesMap = {
  actions: {
    Link: { package: '@lowdefy/actions-core' },
    SetState: { package: '@lowdefy/actions-core' },
    Request: { package: '@lowdefy/actions-core' },
    Reset: { package: '@lowdefy/actions-core' },
    Throw: { package: '@lowdefy/actions-core' },
    Log: { package: '@lowdefy/actions-core' },
    Return: { package: '@lowdefy/api' },
  },
  blocks: {
    Anchor: { package: '@lowdefy/blocks-basic' },
    Box: { package: '@lowdefy/blocks-basic' },
    Button: { package: '@lowdefy/blocks-basic' },
    DangerousHtml: { package: '@lowdefy/blocks-basic' },
    Html: { package: '@lowdefy/blocks-basic' },
    Icon: { package: '@lowdefy/blocks-basic' },
    Img: { package: '@lowdefy/blocks-basic' },
    List: { package: '@lowdefy/blocks-basic' },
    Message: { package: '@lowdefy/blocks-antd' },
    Paragraph: { package: '@lowdefy/blocks-basic' },
    ProgressBar: { package: '@lowdefy/blocks-loaders' },
    Result: { package: '@lowdefy/blocks-antd' },
    Skeleton: { package: '@lowdefy/blocks-loaders' },
    SkeletonAvatar: { package: '@lowdefy/blocks-loaders' },
    SkeletonButton: { package: '@lowdefy/blocks-loaders' },
    SkeletonInput: { package: '@lowdefy/blocks-loaders' },
    SkeletonParagraph: { package: '@lowdefy/blocks-loaders' },
    Span: { package: '@lowdefy/blocks-basic' },
    Spinner: { package: '@lowdefy/blocks-loaders' },
    TextInput: { package: '@lowdefy/blocks-antd' },
    Throw: { package: '@lowdefy/blocks-basic' },
    Title: { package: '@lowdefy/blocks-basic' },
  },
  connections: {
    AxiosHttp: { package: '@lowdefy/connection-axios-http' },
    MongoDBCollection: { package: '@lowdefy/connection-mongodb' },
  },
  requests: {
    AxiosHttp: { package: '@lowdefy/connection-axios-http' },
    MongoDBInsertOne: { package: '@lowdefy/connection-mongodb' },
  },
  auth: {
    adapters: {},
    callbacks: {},
    events: {},
    providers: {
      GoogleProvider: { package: 'next-auth' },
    },
  },
  operators: {
    client: {
      _state: { package: '@lowdefy/operators-js' },
      _if: { package: '@lowdefy/operators-js' },
      _eq: { package: '@lowdefy/operators-js' },
      _not: { package: '@lowdefy/operators-js' },
      _type: { package: '@lowdefy/operators-js' },
      _payload: { package: '@lowdefy/operators-js' },
      _step: { package: '@lowdefy/operators-js' },
    },
    server: {
      _payload: { package: '@lowdefy/operators-js' },
      _step: { package: '@lowdefy/operators-js' },
    },
  },
  controls: {
    Endpoint: { package: '@lowdefy/api' },
    Log: { package: '@lowdefy/api' },
    Return: { package: '@lowdefy/api' },
  },
};

function formatLine(line) {
  const source = line.err?.source ?? null;
  const name = line.err?.name ?? null;
  const message = name ? `[${name}] ${line.msg}` : line.msg;
  return source ? `${source}\n${message}` : message;
}

/**
 * Creates a runBuild helper function for testing build errors.
 *
 * @param {Function} build - The build function (imported after mocking writeBuildArtifact)
 * @param {string} fixturesDir - Absolute path to the fixtures directory
 * @returns {Function} runBuild helper function
 */
function createRunBuild(build, fixturesDir) {
  /**
   * Runs build with a specific fixture directory and stage.
   * Returns captured errors, warnings, and the thrown error (if any).
   */
  return async function runBuild(fixtureDir, stage = 'prod') {
    const configDir = path.join(fixturesDir, fixtureDir);
    const { logger, lines } = createTestLogger();

    let thrownError = null;
    try {
      await build({
        customTypesMap: testTypesMap,
        directories: {
          config: configDir,
          build: path.join(configDir, '.lowdefy'),
          server: path.join(configDir, '.lowdefy', 'server'),
        },
        logger,
        stage,
      });
    } catch (err) {
      thrownError = err;
    }

    // Pino levels: error=50, warn=40
    const errors = lines.filter((l) => l.level >= 50).map(formatLine);
    const warnings = lines.filter((l) => l.level >= 40 && l.level < 50).map(formatLine);

    return { errors, warnings, thrownError, logger };
  };
}

export { testTypesMap, createRunBuild };
