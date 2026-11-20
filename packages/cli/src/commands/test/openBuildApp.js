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

// Opens the app's production build once for a `lowdefy test` run that reads it. The one app
// serves the whole run: the access step, and each headless journey on a fresh session of its own.
// This openTestApp is the run's one build check: a missing build, one of another Lowdefy version
// and one older than the config refuse the run with @lowdefy/test-utils' message, which names the
// command to run, before any journey. `secrets` are the test values the command was given for the
// app's secrets, by name; every other secret reads its stand-in. Returns { app } or { refused };
// the caller closes the app.
async function openBuildApp({ context, secrets }) {
  // Loaded only for a run that reads the build: it brings the server's own modules.
  const { openTestApp } = await import('@lowdefy/test-utils');
  try {
    const app = await openTestApp({
      configDirectory: context.directories.config,
      secrets,
      serverDirectory: context.directories.server,
    });
    return { app };
  } catch (error) {
    return { refused: error.message };
  }
}

export default openBuildApp;
