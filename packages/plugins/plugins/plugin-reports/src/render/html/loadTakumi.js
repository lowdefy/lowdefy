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

// takumi (`@takumi-rs/core`) is a native Rust binding whose platform binaries
// are optionalDependencies: an unsupported platform installs the plugin fine but
// has no binding. Import it lazily so loading the plugin at server boot never
// touches takumi; only rendering an Html block does, and that failure is caught
// per block.
async function loadTakumi() {
  const [{ Renderer }, { fromHtml }] = await Promise.all([
    import('@takumi-rs/core'),
    // eslint-disable-next-line import/no-unresolved -- the eslint resolver does not read exports maps.
    import('@takumi-rs/helpers/html'),
  ]);
  return { Renderer, fromHtml };
}

export default loadTakumi;
