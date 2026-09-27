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

import { fromEvaluationAnswer } from './decideQuestions.js';

const choice = { choice: 'Which team', options: { billing: null, tech: null } };
const yesno = { yesno: 'The service is down' };
const score = { score: 'How urgent', levels: ['low', 'high'] };

// The provider reports a calibrated confidence per question; it must not
// survive an answer that is not one.
test.each([
  {
    name: 'a choice outside the options',
    question: choice,
    answer: { type: 'choice', choice: 'sales', probabilities: { billing: 0.5, tech: 0.5 } },
    expected: { choice: null, confidence: null, probabilities: null },
  },
  {
    name: 'a yes/no without a probability',
    question: yesno,
    answer: { type: 'boolean' },
    expected: { answer: null, probability: null, confidence: null },
  },
  {
    name: 'a score beyond the levels',
    question: score,
    answer: { type: 'score', score: 4 },
    expected: { level: null, index: null, score: null, confidence: null, probabilities: null },
  },
  {
    name: 'no answer',
    question: choice,
    answer: undefined,
    expected: { choice: null, confidence: null, probabilities: null },
  },
])(
  'fromEvaluationAnswer reads $name as no answer, confidence included',
  ({ question, answer, expected }) => {
    expect(fromEvaluationAnswer({ question, answer, providerConfidence: 0.95 })).toEqual(expected);
  }
);
