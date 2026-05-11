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

function matchesRule(rule, stepNumber) {
  if (rule.steps) {
    return rule.steps.includes(stepNumber);
  }
  if (rule.from != null) {
    const fromOk = stepNumber >= rule.from;
    const toOk = rule.to == null || stepNumber <= rule.to;
    return fromOk && toOk;
  }
  return false;
}

function buildPrepareStep(rules) {
  if (!rules || rules.length === 0) return undefined;

  return async function prepareStep({ stepNumber }) {
    for (const rule of rules) {
      if (matchesRule(rule, stepNumber)) {
        const config = {};
        if (rule.activeTools) config.activeTools = rule.activeTools;
        if (rule.toolChoice) config.toolChoice = rule.toolChoice;
        if (rule.maxOutputTokens) config.maxOutputTokens = rule.maxOutputTokens;
        if (rule.temperature != null) config.temperature = rule.temperature;
        return config;
      }
    }
    return {};
  };
}

export default buildPrepareStep;
