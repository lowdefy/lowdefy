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

// The file-plugin directory convention. The order of this list is the order
// discovery walks, which is what makes the discovered records deterministic.
//
// `kinds` are typesMap store paths: an operator under operators/shared fans out
// into the client and the server store, which is how the shipped packages list
// a shared operator in both barrels.
//
// plugins/connections is deliberately absent: a connection needs a second
// directory for its requests, which is a third shape, and it lands after the
// three kinds here.
const filePluginDirectories = [
  {
    directory: 'plugins/blocks',
    extensions: ['.jsx', '.js'],
    kinds: ['blocks'],
    typeClass: 'Block',
    checkSlug: 'block-types',
    naming: 'PascalCase',
  },
  {
    directory: 'plugins/actions',
    extensions: ['.js'],
    kinds: ['actions'],
    typeClass: 'Action',
    checkSlug: 'action-types',
    // Actions have no enforced name shape yet; the block rule exists because a
    // lowercase block type cannot be told apart from an area key in YAML.
    naming: null,
  },
  {
    directory: 'plugins/operators/build',
    extensions: ['.js'],
    kinds: ['operators.build'],
    typeClass: 'Operator',
    checkSlug: 'operator-types',
    naming: 'operator',
  },
  {
    directory: 'plugins/operators/client',
    extensions: ['.js'],
    kinds: ['operators.client'],
    typeClass: 'Operator',
    checkSlug: 'operator-types',
    naming: 'operator',
  },
  {
    directory: 'plugins/operators/server',
    extensions: ['.js'],
    kinds: ['operators.server'],
    typeClass: 'Operator',
    checkSlug: 'operator-types',
    naming: 'operator',
  },
  {
    directory: 'plugins/operators/shared',
    extensions: ['.js'],
    kinds: ['operators.client', 'operators.server'],
    typeClass: 'Operator',
    checkSlug: 'operator-types',
    naming: 'operator',
  },
];

export default filePluginDirectories;
