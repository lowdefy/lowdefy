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

// A block of the fixture app's own plugin, which no headless stand-in models: it renders nothing
// and registers a `run` method that fires its onRun event, as an app's action-chain block does,
// and a `stop` method that fires onStop. Its meta (types.js) declares `run` in headlessMethods, so
// a headless run fires onRun for a CallMethod run; `stop` is left undeclared, so the headless
// runner leaves a CallMethod stop to the browser (packages/cli/test/journeyFixture/headless.test.mjs,
// pages/plugin_block.yaml). It imports no React, since the plugin installs none, and registers its
// methods as it renders.
function FixtureActionChain({ methods }) {
  methods.registerMethod('run', (event) => methods.triggerEvent({ name: 'onRun', event }));
  methods.registerMethod('stop', (event) => methods.triggerEvent({ name: 'onStop', event }));
  return null;
}

export default FixtureActionChain;
