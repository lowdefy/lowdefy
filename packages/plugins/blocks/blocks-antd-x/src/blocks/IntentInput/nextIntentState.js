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

// When the two leading intents are this close and neither is shown solid, offer both.
const CHOICE_MARGIN = 0.15;

// Classifier scores jump around while the user is mid-word, so the shown intent
// only changes when a challenger leads two rounds in a row or reaches the
// `switch` confidence. The block re-runs a round with unchanged scores after a
// pause, so a challenger that holds the lead while the user stops typing also wins.
// `intent: null` is "nothing recognised"; `challenger: undefined` is "no challenger",
// so a null challenger can still take the intent back to idle.
function nextIntentState({ state, scores, confidence }) {
  const ranked = Object.entries(scores)
    .filter(([, p]) => Number.isFinite(p))
    .sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const candidate = top && top[1] >= confidence.preview ? top[0] : null;

  let { intent, challenger } = state;
  if (candidate === intent) {
    challenger = undefined;
  } else if (challenger === candidate || (top?.[1] ?? 0) >= confidence.switch) {
    intent = candidate;
    challenger = undefined;
  } else {
    challenger = candidate;
  }

  if (intent === null) return { intent, challenger, mode: 'idle', choices: [] };

  const p = scores[intent] ?? 0;
  const rival = ranked.find(([key]) => key !== intent);
  if (
    p < confidence.show &&
    rival &&
    rival[1] >= confidence.preview &&
    Math.abs(p - rival[1]) < CHOICE_MARGIN
  ) {
    return { intent, challenger, mode: 'choose', choices: [intent, rival[0]] };
  }
  return { intent, challenger, mode: p >= confidence.show ? 'card' : 'preview', choices: [] };
}

export default nextIntentState;
