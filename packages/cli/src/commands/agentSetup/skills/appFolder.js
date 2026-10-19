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

// How a journeys skill names the app its commands run against. The skills
// carry no app path, so every app in a repository renders the same files.
// An attended skill asks when the choice is open; an unattended one stops and
// lists the apps rather than guess.
function appFolder({ unattended = false } = {}) {
  const open = unattended
    ? 'stop and list the app folders instead of guessing'
    : 'ask the developer which one';
  return `\`<app>\` below is the app's folder, the one holding \`lowdefy.yaml\`: the app the developer named, else
the app folder you are working in, else the repository's only app. When that leaves several, ${open}.
Pass it to every \`lowdefy\` command as \`--config-directory <app>\`; paths such as \`tests/journeys/\` are inside it.`;
}

export default appFolder;
