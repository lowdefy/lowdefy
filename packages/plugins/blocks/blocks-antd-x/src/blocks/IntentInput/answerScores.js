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

// A Decide choice answer ({ choice, confidence, probabilities }) as a score per
// intent. Options without an intent (such as a `none` escape option) drop out.
// The provider's calibrated confidence, where it reports one, is the chosen
// intent's score.
function answerScores({ answer, intents }) {
  const scores = {};
  Object.keys(intents).forEach((key) => {
    const probability = answer?.probabilities?.[key];
    if (Number.isFinite(probability)) scores[key] = probability;
  });
  if (Object.hasOwn(intents, answer?.choice ?? '') && Number.isFinite(answer.confidence)) {
    scores[answer.choice] = answer.confidence;
  }
  return scores;
}

export default answerScores;
