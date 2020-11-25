/*
  Copyright 2020 Lowdefy, Inc

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

import { runBlockSchemaTests, runRenderTests } from '@lowdefy/block-tools';

import validationsExamples from '../demo/validationExamples.json';
import NumberInput from '../src/blocks/NumberInput/NumberInput';
import examples from '../demo/examples/NumberInput.yaml';
import meta from '../src/blocks/NumberInput/NumberInput.json';

runRenderTests({ examples, Block: NumberInput, meta, validationsExamples });
runBlockSchemaTests({ examples, meta });
