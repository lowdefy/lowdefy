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

function createUsageAccumulator() {
  const usage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };

  let finishReason = 'stop';

  function add(stepResult) {
    const stepUsage = stepResult?.usage ?? stepResult;
    if (stepResult?.finishReason) {
      finishReason = stepResult.finishReason;
    }
    if (!stepUsage) return;
    usage.inputTokens += stepUsage.inputTokens ?? 0;
    usage.outputTokens += stepUsage.outputTokens ?? 0;
    usage.totalTokens += stepUsage.totalTokens ?? 0;
    usage.reasoningTokens += stepUsage.outputTokenDetails?.reasoningTokens ?? 0;
    usage.cacheReadTokens += stepUsage.inputTokenDetails?.cacheReadTokens ?? 0;
    usage.cacheWriteTokens += stepUsage.inputTokenDetails?.cacheWriteTokens ?? 0;
  }

  return { usage, add, getFinishReason: () => finishReason };
}

export default createUsageAccumulator;
