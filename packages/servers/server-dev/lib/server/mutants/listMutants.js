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

import { resolveConfigLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import collectSharedIds from './collectSharedIds.js';
import enumerateArtifact from './enumerateArtifact.js';
import groupMutantCopies from './groupMutantCopies.js';
import hashArtifact from './hashArtifact.js';
import hashMutantTarget from './hashMutantTarget.js';
import mutantId from './mutantId.js';
import operatorDefinitions from './operators/index.js';
import positionFreePath from './positionFreePath.js';

function artifactPaths({ pages, requests, endpoints, appEvents }) {
  return [
    ...pages.map((pageId) => `pages/${pageId}.json`),
    ...requests.map(({ pageId, requestId }) => `pages/${pageId}/requests/${requestId}.json`),
    ...endpoints.map((endpointId) => `api/${endpointId}.json`),
    ...(appEvents ? ['events.json'] : []),
  ];
}

// Every mutant on the artifacts a set of journey runs exercised, each with a
// build-independent id, its anchor, the source line and config path of its
// target, and `_ref` copies grouped into one mutant. Also returns the content
// hash of every artifact read, so a harden run can tell which of its verdicts
// a config edit left standing.
async function listMutants({
  pages = [],
  requests = [],
  endpoints = [],
  appEvents = false,
  operators,
  readConfigFile,
  keyMap,
  refMap,
}) {
  const selected = type.isNone(operators)
    ? Object.values(operatorDefinitions)
    : operators.map((name) => operatorDefinitions[name]);
  const sharedIds = collectSharedIds({ keyMap });
  const artifacts = {};
  const mutants = [];
  for (const artifact of [...new Set(artifactPaths({ pages, requests, endpoints, appEvents }))]) {
    const root = await readConfigFile(artifact);
    if (type.isNone(root)) {
      continue;
    }
    artifacts[artifact] = hashArtifact(root);
    enumerateArtifact({ artifact, root, operators: selected }).forEach(({ node, ...mutant }) => {
      const location = resolveConfigLocation({ configKey: mutant.key, keyMap, refMap });
      const config = location?.config ?? null;
      mutants.push({
        ...mutant,
        id: mutantId({
          artifact,
          configPath: positionFreePath({ configPath: config ?? mutant.key, sharedIds }),
          operator: mutant.operator,
          arg: mutant.arg,
        }),
        artifact,
        source: location?.source ?? null,
        config,
        nodeHash: hashMutantTarget(node),
      });
    });
  }
  return {
    artifacts,
    mutants: groupMutantCopies({ mutants }).map(
      ({
        id,
        operator,
        artifact,
        key,
        arg,
        anchor,
        source,
        config,
        describe,
        copies,
        copyTargets,
      }) => ({
        id,
        operator,
        artifact,
        key,
        arg,
        anchor,
        source,
        config,
        describe,
        copies,
        copyTargets,
      })
    ),
  };
}

export default listMutants;
