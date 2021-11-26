/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { runBlockSchemaTests, runRenderTests } from '@lowdefy/block-dev';

import Block from './CheckboxSwitch.js';
import block from './index.js';
import examples from './examples.yaml';
import schema from './schema.json';
import validationsExamples from '../../validationExamples.js';

// test: {
//   validation: true,
//   required: true,
//   values: [true],
// }

const { meta, tests } = block;

runRenderTests({ Block, examples, meta, schema, tests, validationsExamples });
runBlockSchemaTests({ examples, meta, schema });
