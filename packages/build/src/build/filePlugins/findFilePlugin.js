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

/**
 * The discovered file-plugin record for one type name of one kind, or undefined
 * when the type came from a package.
 *
 * Import records carry only the type names — the file a type was discovered at,
 * and the meta/schema/hazards read from its sibling JSON, stay on the record.
 */
function findFilePlugin({ context, kind, typeName }) {
  return (context.filePlugins ?? []).find(
    (record) => record.kind === kind && record.typeName === typeName
  );
}

export default findFilePlugin;
