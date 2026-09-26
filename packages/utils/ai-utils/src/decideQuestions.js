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

// An evaluation model's answer (choice / score / boolean with probabilities)
// as a Decide answer. `confidence` is the provider's calibrated confidence
// when it reports one, otherwise the probability of the chosen answer.
export function fromEvaluationAnswer({ question, answer, providerConfidence }) {
  const kind = questionKind(question);
  const reported = clamp01(providerConfidence);
  if (kind === 'choice') {
    const probabilities = answer?.probabilities ?? null;
    return {
      choice: answer?.choice ?? null,
      confidence: reported ?? clamp01(probabilities?.[answer?.choice]) ?? null,
      probabilities,
    };
  }
  if (kind === 'yesno') {
    const probability = clamp01(answer?.probability);
    return {
      answer: probability === null ? null : probability >= 0.5,
      probability,
      confidence:
        reported ?? (probability === null ? null : Math.max(probability, 1 - probability)),
    };
  }
  const levels = question.levels ?? [];
  const byIndex = answer?.probabilities ?? null;
  const best = maxEntry(byIndex);
  const index = best
    ? Number(best[0])
    : Number.isFinite(answer?.score)
      ? Math.round(answer.score)
      : null;
  return {
    level: index === null ? null : levels[index] ?? null,
    index,
    score: Number.isFinite(answer?.score) ? answer.score : null,
    confidence: reported ?? (best ? clamp01(best[1]) : null),
    probabilities: byIndex
      ? Object.fromEntries(Object.entries(byIndex).map(([i, p]) => [levels[Number(i)] ?? i, p]))
      : null,
  };
}

// A language model's structured-output answer ({ choice | answer | level,
// confidence }) as a Decide answer. The confidence is the model's own
// estimate — not calibrated the way an evaluation model's probabilities are.
export function fromStructuredAnswer({ question, answer }) {
  const kind = questionKind(question);
  const confidence = clamp01(answer?.confidence);
  if (kind === 'choice') {
    return { choice: answer?.choice ?? null, confidence, probabilities: null };
  }
  if (kind === 'yesno') {
    const value = typeof answer?.answer === 'boolean' ? answer.answer : null;
    return {
      answer: value,
      probability:
        value === null || confidence === null ? null : value ? confidence : 1 - confidence,
      confidence,
    };
  }
  const levels = question.levels ?? [];
  const index = levels.indexOf(answer?.level);
  return {
    level: index === -1 ? null : levels[index],
    index: index === -1 ? null : index,
    score: index === -1 ? null : index,
    confidence,
    probabilities: null,
  };
}
