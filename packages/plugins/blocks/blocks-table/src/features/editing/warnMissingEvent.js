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

// Development warning, once per table and event: an edit or move shows in the table but nothing
// saves it.
function warnMissingEvent({ api, name, what }) {
  if (process.env.NODE_ENV === 'production' || api.editing.warned.has(name)) return;
  api.editing.warned.add(name);
  // eslint-disable-next-line no-console
  console.warn(
    `Table "${api.blockId}" allows ${what} but has no ${name} event, so they only show in the table and are never saved. Add an ${name} event that saves them.`
  );
}

export default warnMissingEvent;
