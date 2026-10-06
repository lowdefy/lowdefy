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

const POLICIES = ['model', 'jev', 'seeded'];
// The structured-output model (--policy model, and Jev's fallback) and the
// spend cap ($1.00 a run). --model / LOWDEFY_EXPLORER_MODEL and --max-cost
// change them.
const DEFAULT_MODEL_ID = 'google/gemini-2.5-flash-lite';
const JEV_MODEL_ID = 'typesafe-ai/jev';
const DEFAULT_MAX_COST_USD = 1;

// Which policy a run uses: --policy, else jev when AI_GATEWAY_API_KEY is set
// (read after startUp loaded the app's .env), else seeded. jev asks the
// Gateway's evaluation model, built for one typed choice over many options,
// and falls back, visibly, to the structured-output model (--model, else
// LOWDEFY_EXPLORER_MODEL, else the default) when the Gateway refuses it or a
// request is over its limits. model asks that structured-output model only;
// it is the choice for an app that needs zero data retention, which Jev's
// only endpoint does not offer. A charter steers the model through the
// state it reads, which the seeded policy never reads, so --charter or
// --charters with the seeded policy is refused.
function resolvePolicy({ options = {}, env = process.env }) {
  const apiKey = env.AI_GATEWAY_API_KEY;
  const policy = options.policy ?? (type.isNone(apiKey) || apiKey === '' ? 'seeded' : 'jev');
  if (!POLICIES.includes(policy)) {
    throw new Error(`--policy should be one of ${POLICIES.join(', ')}. Received "${policy}".`);
  }
  const maxCost = type.isNone(options.maxCost) ? DEFAULT_MAX_COST_USD : Number(options.maxCost);
  if (!Number.isFinite(maxCost) || maxCost <= 0) {
    throw new Error(
      `--max-cost should be a number of US dollars above 0. Received "${options.maxCost}".`
    );
  }
  const charterFlag = type.isNone(options.charters) ? '--charter' : '--charters';
  if (policy === 'seeded' && (!type.isNone(options.charter) || !type.isNone(options.charters))) {
    throw new Error(
      options.policy === 'seeded'
        ? `${charterFlag} needs a model to steer, and --policy seeded never reads the charter. Use --policy jev or model.`
        : `${charterFlag} needs a model to steer, and without AI_GATEWAY_API_KEY the seeded policy runs, which never reads the charter. Set AI_GATEWAY_API_KEY in the shell or the app's .env.`
    );
  }
  if (policy === 'seeded') {
    return { policy, backend: null, modelId: null, apiKey: null, maxCost };
  }
  if (type.isNone(apiKey) || apiKey === '') {
    throw new Error(
      `--policy ${policy} needs AI_GATEWAY_API_KEY in the shell or the app's .env. Without a key, the seeded policy runs.`
    );
  }
  const structuredModelId = options.model ?? env.LOWDEFY_EXPLORER_MODEL ?? DEFAULT_MODEL_ID;
  if (policy === 'jev') {
    return {
      policy,
      backend: 'evaluation',
      modelId: JEV_MODEL_ID,
      fallbackModelId: structuredModelId,
      apiKey,
      maxCost,
    };
  }
  return { policy, backend: 'structured-output', modelId: structuredModelId, apiKey, maxCost };
}

export default resolvePolicy;
