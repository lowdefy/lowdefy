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

import archetypeProps from './archetypeProps.js';
import listPage from './listPage.js';

// The framework-owned archetype registry: type name -> { props, generate }.
// Archetypes are code (a generator that reads collections: and emits a variable
// block tree), not YAML components, so the registry is static rather than built
// from config. DetailPage and EditPage are added by their own tasks.
const archetypes = {
  ListPage: { props: archetypeProps.ListPage, generate: listPage },
};

export default archetypes;
