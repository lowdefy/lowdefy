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

const { withPodfile, withRunOnce, withSettingsGradle } = require('expo/config-plugins');

function quotedList(names) {
  return `[${names.map((name) => `'${name}'`).join(', ')}]`;
}

// Replaces `pattern` once in a native project file, and fails the prebuild when the Expo template no
// longer has it: a shell that links a module it should not must never build quietly.
function replaceOnce({ contents, file, pattern, replace }) {
  if (!pattern.test(contents)) {
    throw new Error(
      `Cannot exclude native modules: ${file} no longer matches ${pattern}. Update withExcludedNativeModules.js for this Expo template.`
    );
  }
  return contents.replace(pattern, replace);
}

/**
 * Leaves native modules out of a shell's native projects (getExclusions in shellVariant.js), so a
 * shell carries only its capability profile's modules, and a release shell none of Lowdefy Dev's:
 * - iOS: `use_expo_modules!` and the react-native-config command in the Podfile get `exclude`.
 * - Android: settings.gradle sets `expoAutolinking.exclude` and adds `--exclude` to the
 *   react-native-config command.
 * - Each module's config plugin is marked as run, so prebuild does not apply it on its own and
 *   add its permissions (NSCameraUsageDescription, NSMotionUsageDescription, CAMERA).
 *
 * @param {Object} config The Expo config.
 * @param {string[]} modules The package names to leave out.
 */
function withExcludedNativeModules(config, modules) {
  if (modules.length === 0) {
    return config;
  }
  let result = modules.reduce(
    (current, name) => withRunOnce(current, { plugin: (unchanged) => unchanged, name }),
    config
  );
  result = withPodfile(result, (podfileConfig) => {
    let { contents } = podfileConfig.modResults;
    contents = replaceOnce({
      contents,
      file: 'Podfile',
      pattern: /^(\s*)use_expo_modules!\s*$/m,
      replace: `$1use_expo_modules!(exclude: ${quotedList(modules)})`,
    });
    contents = replaceOnce({
      contents,
      file: 'Podfile',
      pattern: /('react-native-config',\s*'--json',\s*'--platform',\s*'ios')/,
      replace: `$1,\n      ${modules.map((name) => `'--exclude', '${name}'`).join(',\n      ')}`,
    });
    podfileConfig.modResults.contents = contents;
    return podfileConfig;
  });
  result = withSettingsGradle(result, (settingsConfig) => {
    let { contents } = settingsConfig.modResults;
    contents = replaceOnce({
      contents,
      file: 'settings.gradle',
      pattern: /^expoAutolinking\.useExpoModules\(\)\s*$/m,
      replace: `expoAutolinking.exclude = ${quotedList(modules)}\nexpoAutolinking.useExpoModules()`,
    });
    contents = replaceOnce({
      contents,
      file: 'settings.gradle',
      pattern: /ex\.autolinkLibrariesFromCommand\(expoAutolinking\.rnConfigCommand\)/,
      replace: `ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand + ${quotedList(
        modules.flatMap((name) => ['--exclude', name])
      )})`,
    });
    settingsConfig.modResults.contents = contents;
    return settingsConfig;
  });
  return result;
}

module.exports = withExcludedNativeModules;
