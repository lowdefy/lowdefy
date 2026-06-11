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

// Restart protocol between the lowdefy() Vite plugin and the supervisor:
// the plugin exits with this code when a fresh Node process is required
// (stale native ESM cache for plugin packages, .env or auth changes); the
// supervisor respawns immediately. Exit 0 stops; other codes are crashes
// and respawn with backoff.
const RESTART_EXIT_CODE = 87;

export default RESTART_EXIT_CODE;
