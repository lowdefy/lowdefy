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

import { type } from '@lowdefy/helpers';

// The question shapes a Decide request accepts, and the one place that knows
// how each shape reads back. A question is exactly one of:
//
//   choice: <instructions>   options: { <name>: <description>, ... }
//   yesno:  <instructions>   criteria: { yes: <description>, no: <description> }  (optional)
//   score:  <instructions>   levels: [<lowest>, ..., <highest>]
//
// Answers are keyed by question id, so a routine reads
// `_step: <stepId>.<questionId>.choice`. `usage` is reserved for the call's
// token usage.

export const RESERVED_QUESTION_IDS = ['usage'];

// The fields each answer carries — the build checks `_step` references
// against these, and the backends shape their answers to them.
export const ANSWER_FIELDS = {
  choice: ['choice', 'confidence', 'probabilities'],
  yesno: ['answer', 'probability', 'confidence'],
  score: ['level', 'index', 'score', 'confidence', 'probabilities'],
};

export function questionKind(question) {
  if (question?.choice !== undefined) return 'choice';
  if (question?.yesno !== undefined) return 'yesno';
  if (question?.score !== undefined) return 'score';
  return null;
}

// The values a branch may compare a field against — the options of a choice,
// the level names of a score. Used by the build's branch check.
export function answerValues(question) {
  const kind = questionKind(question);
  if (kind === 'choice') return { field: 'choice', values: Object.keys(question.options ?? {}) };
  if (kind === 'score') return { field: 'level', values: question.levels ?? [] };
  return null;
}

const clamp01 = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null);

function maxEntry(probabilities) {
  let best = null;
  for (const [key, value] of Object.entries(probabilities ?? {})) {
    if (Number.isFinite(value) && (best === null || value > best[1])) best = [key, value];
  }
  return best;
}

// An answer outside the question's own terms (an option or level the question
// does not have, a yes/no that is not a boolean, no answer at all) is no
// answer: every field is null, the confidence included, so a gate such as
// `_lt: [{ _step: triage.team.confidence }, 0.7]` holds it back as it holds a
// low-confidence one.
function unanswered(kind) {
  if (kind === 'choice') return { choice: null, confidence: null, probabilities: null };
  if (kind === 'yesno') return { answer: null, probability: null, confidence: null };
  return { level: null, index: null, score: null, confidence: null, probabilities: null };
}

function isOption({ question, choice }) {
  return typeof choice === 'string' && Object.hasOwn(question.options ?? {}, choice);
}

function roundedScore(score) {
  if (!Number.isFinite(score)) return null;
  return Math.round(score);
}

// An evaluation model's answer (choice / score / boolean with probabilities)
// as a Decide answer. `confidence` is the provider's calibrated confidence
// when it reports one, otherwise the probability of the chosen answer.
export function fromEvaluationAnswer({ question, answer, providerConfidence }) {
  const kind = questionKind(question);
  const reported = clamp01(providerConfidence);
  if (kind === 'choice') {
    if (!isOption({ question, choice: answer?.choice })) return unanswered(kind);
    const probabilities = answer.probabilities ?? null;
    return {
      choice: answer.choice,
      confidence: reported ?? clamp01(probabilities?.[answer.choice]),
      probabilities,
    };
  }
  if (kind === 'yesno') {
    const probability = clamp01(answer?.probability);
    if (probability === null) return unanswered(kind);
    return {
      answer: probability >= 0.5,
      probability,
      confidence: reported ?? Math.max(probability, 1 - probability),
    };
  }
  const levels = question.levels ?? [];
  const byIndex = answer?.probabilities ?? null;
  const best = maxEntry(byIndex);
  const index = best ? Number(best[0]) : roundedScore(answer?.score);
  if (index === null || type.isUndefined(levels[index])) return unanswered(kind);
  let bestConfidence = null;
  if (best) bestConfidence = clamp01(best[1]);
  let probabilities = null;
  if (byIndex) {
    probabilities = Object.fromEntries(
      Object.entries(byIndex).map(([i, p]) => [levels[Number(i)] ?? i, p])
    );
  }
  return {
    level: levels[index],
    index,
    score: Number.isFinite(answer?.score) ? answer.score : null,
    confidence: reported ?? bestConfidence,
    probabilities,
  };
}

// The probability that a yes/no statement holds, from the model's confidence
// in the answer it gave.
function yesProbability({ answer, confidence }) {
  if (confidence === null) return null;
  if (answer) return confidence;
  return 1 - confidence;
}

// A language model's structured-output answer ({ choice | answer | level,
// confidence }) as a Decide answer. The confidence is the model's own
// estimate — not calibrated the way an evaluation model's probabilities are.
// The SDK parses the output without checking it against the answer schema,
// so every answer is checked here.
export function fromStructuredAnswer({ question, answer }) {
  const kind = questionKind(question);
  const confidence = clamp01(answer?.confidence);
  if (kind === 'choice') {
    if (!isOption({ question, choice: answer?.choice })) return unanswered(kind);
    return { choice: answer.choice, confidence, probabilities: null };
  }
  if (kind === 'yesno') {
    if (!type.isBoolean(answer?.answer)) return unanswered(kind);
    return {
      answer: answer.answer,
      probability: yesProbability({ answer: answer.answer, confidence }),
      confidence,
    };
  }
  const levels = question.levels ?? [];
  const index = levels.indexOf(answer?.level);
  if (index === -1) return unanswered(kind);
  return { level: levels[index], index, score: index, confidence, probabilities: null };
}
