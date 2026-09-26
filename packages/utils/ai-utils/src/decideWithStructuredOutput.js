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

import { generateText, jsonSchema, Output } from 'ai';

import { fromStructuredAnswer, questionKind } from './decideQuestions.js';

const INSTRUCTIONS = [
  'You make typed decisions about the STATE below. Answer every question from the state alone.',
  'For each answer also give "confidence": the probability, from 0 to 1, that the answer is right.',
  'Be calibrated — 0.9 should be right nine times in ten. When the state does not settle a question, say so with a low confidence rather than guessing high.',
].join('\n');

const confidence = {
  type: 'number',
  description: 'Probability from 0 to 1 that the answer is right.',
};

function answerSchema(question) {
  const kind = questionKind(question);
  const value =
    kind === 'choice'
      ? { choice: { type: 'string', enum: Object.keys(question.options) } }
      : kind === 'yesno'
        ? { answer: { type: 'boolean' } }
        : { level: { type: 'string', enum: question.levels } };
  return {
    type: 'object',
    properties: { ...value, confidence },
    required: [...Object.keys(value), 'confidence'],
    additionalProperties: false,
  };
}

function describeQuestion(id, question) {
  const kind = questionKind(question);
  if (kind === 'choice') {
    const options = Object.entries(question.options).map(
      ([name, description]) => `    - ${name}${description ? `: ${description}` : ''}`
    );
    return [`- ${id} (pick one option): ${question.choice}`, ...options].join('\n');
  }
  if (kind === 'yesno') {
    const criteria = question.criteria
      ? [
          question.criteria.yes ? `    - yes: ${question.criteria.yes}` : null,
          question.criteria.no ? `    - no: ${question.criteria.no}` : null,
        ].filter(Boolean)
      : [];
    return [`- ${id} (true or false): ${question.yesno}`, ...criteria].join('\n');
  }
  const levels = question.levels.map((level, index) => `    ${index}. ${level}`);
  return [`- ${id} (pick one level, lowest first): ${question.score}`, ...levels].join('\n');
}

// The structured-output backend: a language model returns every answer as one
// schema-checked object — the stand-in wherever no evaluation model is
// available, on any AI connection.
async function decideWithStructuredOutput({ model, request, options }) {
  const entries = Object.entries(request.questions);
  const schema = {
    type: 'object',
    properties: Object.fromEntries(entries.map(([id, question]) => [id, answerSchema(question)])),
    required: entries.map(([id]) => id),
    additionalProperties: false,
  };
  const state =
    typeof request.state === 'string' ? request.state : JSON.stringify(request.state, null, 2);
  const result = await generateText({
    model,
    instructions: INSTRUCTIONS,
    prompt: [
      '## STATE',
      state,
      '',
      '## QUESTIONS',
      ...entries.map(([id, question]) => describeQuestion(id, question)),
    ].join('\n'),
    output: Output.object({ schema: jsonSchema(schema), name: 'decisions' }),
    ...options,
  });
  const answers = {};
  for (const [id, question] of entries) {
    answers[id] = fromStructuredAnswer({ question, answer: result.output?.[id] });
  }
  return { answers, usage: result.usage };
}

export default decideWithStructuredOutput;
