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

import findingKey from './findingKey.js';
import JOURNEY_FINDING_SEVERITY from './JOURNEY_FINDING_SEVERITY.js';
import relativeSource from './relativeSource.js';

// Turns a step's finding drafts ({ kind, message, source, configKey }) into its findings
// { kind, severity, message, pageId, source, configKey, key }, one per key, with sources relative
// to configDirectory. An environment finding explains the rest of the step's errors, and a
// dev-server finding means the page's own errors are only its echo of a call that got no answer,
// so either one, when present, is all the step reports.
function keyFindings({ configDirectory, drafts, pageId }) {
  let findings = drafts.map(({ configKey = null, kind, message, source = null }) => ({
    kind,
    severity: JOURNEY_FINDING_SEVERITY[kind],
    message,
    pageId,
    source: relativeSource({ source, configDirectory }),
    configKey,
  }));
  if (findings.some((finding) => finding.kind === 'environment')) {
    findings = findings.filter((finding) => finding.kind === 'environment');
  }
  if (findings.some((finding) => finding.kind === 'dev-server')) {
    findings = findings.filter((finding) => finding.kind === 'dev-server');
  }
  const seen = new Set();
  return findings
    .map((finding) => ({ ...finding, key: findingKey(finding) }))
    .filter((finding) => {
      if (seen.has(finding.key)) return false;
      seen.add(finding.key);
      return true;
    });
}

export default keyFindings;
