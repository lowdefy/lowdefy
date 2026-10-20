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

const fs = require('node:fs');
const path = require('node:path');
const { IOSConfig, withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const FILE_NAME = 'LowdefyAppShortcuts.swift';

// Adds the shell's App Shortcuts intent (LowdefyAppShortcuts.swift.template) to the iOS app target:
// Siri, Spotlight and the Shortcuts app open the app's shortcuts by name. App Intents must be
// compiled into the app itself, so the file is written beside the app's sources with the shell's
// scheme and added to the target. Android's long-press shortcuts come from expo-quick-actions alone.
function withAppShortcuts(config) {
  if (typeof config.scheme !== 'string') {
    return config;
  }
  const scheme = config.scheme;
  config = withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(modConfig.modRequest.projectRoot);
      const source = fs
        .readFileSync(path.join(__dirname, `${FILE_NAME}.template`), 'utf8')
        .replaceAll('__SCHEME__', scheme);
      fs.writeFileSync(
        path.join(modConfig.modRequest.platformProjectRoot, projectName, FILE_NAME),
        source
      );
      return modConfig;
    },
  ]);
  return withXcodeProject(config, (modConfig) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(modConfig.modRequest.projectRoot);
    const filepath = `${projectName}/${FILE_NAME}`;
    if (!modConfig.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project: modConfig.modResults,
      });
    }
    return modConfig;
  });
}

module.exports = withAppShortcuts;
