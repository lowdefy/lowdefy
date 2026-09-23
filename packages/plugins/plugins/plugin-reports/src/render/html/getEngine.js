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

import loadTakumi from './loadTakumi.js';

// One renderer per process: constructing it initialises the Rust engine, and
// takumi caches parsed stylesheets and rasters on the instance, so every Html
// block in every report reuses one parse of the app's compiled CSS.
let engine;

async function getEngine() {
  if (!engine) {
    const { Renderer, fromHtml } = await loadTakumi();
    engine = { renderer: new Renderer(), fromHtml };
  }
  return engine;
}

export default getEngine;
