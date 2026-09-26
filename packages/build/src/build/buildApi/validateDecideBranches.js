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

import { decideAnswerValues, decideQuestionKind, DECIDE_ANSWER_FIELDS } from '@lowdefy/ai-utils';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import traverseConfig from '../../utils/traverseConfig.js';

const isOperator = (value) =>
  type.isObject(value) && Object.keys(value).some((key) => key.startsWith('_'));

// Decide steps whose questions are written out in the config (not built by an
// operator) — the only ones whose options the build can know.
function collectDecideSteps(routine) {
  const steps = new Map();
  traverseConfig({
    config: routine,
    visitor: (obj) => {
      if (obj.type !== 'Decide' || !obj.stepId) return;
      const questions = obj.properties?.questions;
      if (!type.isObject(questions) || isOperator(questions)) return;
      const known = {};
      for (const [id, question] of Object.entries(questions)) {
        if (id.startsWith('~')) continue; // build markers
        if (!type.isObject(question) || isOperator(question)) continue;
        const kind = decideQuestionKind(question);
        if (kind) known[id] = { question, kind };
      }
      steps.set(obj.stepId, known);
    },
  });
  return steps;
}

function stepPath(operand) {
  if (!type.isObject(operand) || operand._step === undefined) return null;
  const value = type.isString(operand._step)
    ? operand._step
    : type.isObject(operand._step)
      ? operand._step.key || operand._step.path
      : null;
  if (!type.isString(value)) return null;
  return { parts: value.split('.'), path: value, configKey: operand['~k'] };
}

// Decide answers are typed, so the build can hold a routine to them: a _step
// reference must name a question the step asks and a field its answer has,
// and a branch that compares a choice (or a score level) with a literal must
// use one of that question's options — a renamed option fails the build here
// instead of silently never matching at runtime (designs/10x #9).
function validateDecideBranches({ endpoint, context }) {
  const decideSteps = collectDecideSteps(endpoint.routine);
  if (decideSteps.size === 0) return;

  const reported = new Set();
  const report = (message, configKey) => {
    if (reported.has(message)) return;
    reported.add(message);
    context.handleError(new ConfigError(message, { configKey }));
  };

  const resolve = (ref) => {
    const [stepId, questionId, field] = ref.parts;
    const questions = decideSteps.get(stepId);
    if (!questions || questionId === undefined || questionId === 'usage') return null;
    const entry = questions[questionId];
    if (!entry) {
      report(
        `_step "${ref.path}" in endpoint "${endpoint.endpointId}" names question "${questionId}", ` +
          `but Decide step "${stepId}" asks no such question. ` +
          `Its questions are: ${Object.keys(questions).join(', ')}.`,
        ref.configKey
      );
      return null;
    }
    if (field !== undefined && !DECIDE_ANSWER_FIELDS[entry.kind].includes(field)) {
      report(
        `_step "${ref.path}" in endpoint "${endpoint.endpointId}" reads "${field}", ` +
          `but a ${entry.kind} answer has only: ${DECIDE_ANSWER_FIELDS[entry.kind].join(', ')}.`,
        ref.configKey
      );
      return null;
    }
    return { ...entry, stepId, questionId, field };
  };

  traverseConfig({
    config: endpoint.routine,
    visitor: (obj) => {
      const ref = stepPath(obj);
      if (ref) resolve(ref);

      for (const operator of ['_eq', '_ne']) {
        const operands = obj[operator];
        if (!type.isArray(operands) || operands.length !== 2) continue;
        for (const [side, other] of [
          [operands[0], operands[1]],
          [operands[1], operands[0]],
        ]) {
          const sideRef = stepPath(side);
          if (!sideRef || !type.isString(other)) continue;
          const target = resolve(sideRef);
          if (!target) continue;
          const allowed = decideAnswerValues(target.question);
          if (!allowed || allowed.field !== target.field) continue;
          // Build markers (~k, ~r) ride on the options object; they are not options.
          const values = allowed.values.filter((value) => !String(value).startsWith('~'));
          if (values.includes(other)) continue;
          report(
            `${operator} in endpoint "${endpoint.endpointId}" compares "${sideRef.path}" with "${other}", ` +
              `which is not ${target.kind === 'choice' ? 'an option' : 'a level'} of question "${
                target.questionId
              }" ` +
              `(${allowed.values.join(', ')}). The branch could never match.`,
            obj['~k'] ?? sideRef.configKey
          );
        }
      }
    },
  });
}

export default validateDecideBranches;
