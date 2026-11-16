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

const dependencyFields = ['dependencies', 'devDependencies'];

// True when the last install already satisfies packageJson: the install
// settings are the same, and every dependency it lists was installed with the
// identical spec, in the same field. Installed packages it no longer lists do
// not matter, since the server only loads the packages its build imports.
function isInstallSatisfied({ installState, packageJson, settingsHash }) {
  if (installState.settingsHash !== settingsHash) {
    return false;
  }
  return dependencyFields.every((field) => {
    const installed = installState[field] ?? {};
    return Object.entries(packageJson[field] ?? {}).every(
      ([name, spec]) => Object.hasOwn(installed, name) && installed[name] === spec
    );
  });
}

export default isInstallSatisfied;
