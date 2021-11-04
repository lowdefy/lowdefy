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

import { type } from '@lowdefy/helpers';
import mingo from 'mingo';
import { useOperators, OperatorType } from 'mingo/core';
import * as accumulatorOperators from 'mingo/operators/accumulator';
import * as expressionOperators from 'mingo/operators/expression';
import * as pipelineOperators from 'mingo/operators/pipeline';
import * as queryOperators from 'mingo/operators/query';
import * as projectionOperators from 'mingo/operators/projection';

useOperators(OperatorType.ACCUMULATOR, accumulatorOperators);
useOperators(OperatorType.EXPRESSION, expressionOperators);
useOperators(OperatorType.PIPELINE, pipelineOperators);
useOperators(OperatorType.PROJECTION, queryOperators);
useOperators(OperatorType.QUERY, projectionOperators);

function mingoAggregation({ input = [], pipeline = [] }) {
  if (!type.isArray(input)) {
    throw new Error('Mingo aggregation error. Argument "input" should be an array.');
  }
  if (!type.isArray(pipeline)) {
    throw new Error('Mingo aggregation error. Argument "pipeline" should be an array.');
  }
  const aggregator = new mingo.Aggregator(pipeline);
  return aggregator.run(input);
}

export default mingoAggregation;
