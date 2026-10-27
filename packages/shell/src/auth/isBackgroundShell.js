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

// The shell profile that reports location in the background (shell.json `profile`). Its
// background task calls the server while the phone is locked, so its session token must stay
// readable then, and biometrics guard only its screens.
const BACKGROUND_PROFILES = ['field-tracking'];

function isBackgroundShell(shell) {
  return BACKGROUND_PROFILES.includes(shell.profile);
}

export default isBackgroundShell;
