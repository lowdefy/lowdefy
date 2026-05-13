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

function SetLocale({ globals, methods, params }) {
  const { window } = globals;
  const next = params?.locale ?? 'auto';
  window.__lowdefy_setLocale?.(next);

  // Trigger engine update cascade so _locale and _t re-evaluate in all blocks.
  methods.setGlobal({});
}

export default SetLocale;
