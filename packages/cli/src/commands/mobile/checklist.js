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

import createChecklist from './createChecklist.js';
import loadInstalledShellPlugins from './loadInstalledShellPlugins.js';
import loadMobileShell from './loadMobileShell.js';

function formatChecklist({ shell, environment, steps }) {
  const lines = [
    `Steps a person does for shell "${shell.id}" (${
      shell.distribution ?? 'private'
    }, ${environment}):`,
  ];
  steps.forEach((step, index) => {
    lines.push('', `${index + 1}. ${step.done ? '[done] ' : ''}${step.title}`);
    step.details.forEach((detail) => lines.push(`   - ${detail}`));
  });
  lines.push(
    '',
    'Optional: set SENTRY_AUTH_TOKEN where build and update run, to upload source maps.'
  );
  return lines.join('\n');
}

// lowdefy mobile checklist: prints what the stores still need a person for.
// It runs no EAS command.
async function mobileChecklist({ context }) {
  const { environment, profile, projectDirectory, shell, shellPackage } = await loadMobileShell({
    context,
  });
  const plugins = loadInstalledShellPlugins({
    environment,
    projectDirectory,
    shell,
    shellPackage,
  });
  const steps = createChecklist({ shell, profile, env: environment, plugins });
  context.logger.info(formatChecklist({ shell, environment, steps }));
  return steps;
}

export default mobileChecklist;
