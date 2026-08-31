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

// build/componentDefs.json is written on every build, as {} when the app
// declares no components, so the dev JIT page build (which runs in a separate
// process and rebuilds its context from artifacts) can expand component
// instances identically to a full build. Build-only bookkeeping (configKey) is
// stripped; the artifact shape is a contract - keep it stable.
function writeComponentDefs({ context }) {
  const componentDefs = {};
  Object.keys(context.componentDefs ?? {}).forEach((name) => {
    const def = context.componentDefs[name];
    componentDefs[name] = {
      id: def.id,
      props: def.props,
      slots: def.slots,
      blocks: def.blocks,
    };
  });
  return context.writeBuildArtifact('componentDefs.json', JSON.stringify(componentDefs, null, 2));
}

export default writeComponentDefs;
