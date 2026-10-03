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

import { experimental_evaluate as evaluate } from 'ai';
import { type } from '@lowdefy/helpers';

import { fromEvaluationAnswer, questionKind } from './decideQuestions.js';

function toEvaluationQuestion(question) {
  const kind = questionKind(question);
  if (kind === 'choice') {
    return { type: 'choice', instructions: question.choice, criteria: question.options };
  }
  if (kind === 'yesno') {
    return {
      type: 'boolean',
      instructions: question.yesno,
      ...(question.criteria
        ? { criteria: { true: question.criteria.yes ?? null, false: question.criteria.no ?? null } }
        : {}),
    };
  }
  return { type: 'score', instructions: question.score, criteria: question.levels };
}

// evaluate takes no timeout, so the timeout becomes part of its abort signal. It takes
// no maxOutputTokens either: an evaluation model returns probabilities, not text.
function toEvaluateOptions({ abortSignal, maxOutputTokens, timeout, ...options }) {
  const signals = [abortSignal];
  if (!type.isNone(timeout)) {
    signals.push(AbortSignal.timeout(timeout));
  }
  const present = signals.filter((signal) => !type.isNone(signal));
  if (present.length > 0) {
    options.abortSignal = AbortSignal.any(present);
  }
  return options;
}

// The evaluation backend: an evaluation model answers every question in one
// pass, with a probability for each option (ai experimental_evaluate).
async function decideWithEvaluation({ model, state, questions, options }) {
  const result = await evaluate({
    model,
    state,
    questions: Object.fromEntries(
      Object.entries(questions).map(([id, question]) => [id, toEvaluationQuestion(question)])
    ),
    ...toEvaluateOptions(options),
  });
  // TypeSafe reports a calibrated confidence per question alongside the
  // probabilities; other evaluation providers may not.
  const confidence = Object.values(result.providerMetadata ?? {}).find(
    (metadata) => metadata && typeof metadata.confidence === 'object'
  )?.confidence;
  const answers = {};
  for (const [id, question] of Object.entries(questions)) {
    answers[id] = fromEvaluationAnswer({
      question,
      answer: result.answers?.[id],
      providerConfidence: confidence?.[id],
    });
  }
  return { answers, usage: result.usage, providerMetadata: result.providerMetadata };
}

export default decideWithEvaluation;
