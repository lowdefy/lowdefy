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

// The steps the data-set rails check, each with the words their refusals use: what a refused
// journey cannot do to the block (`act`) and what to call one such step (`step`). Each acts on
// a block and can fire its events: a click its onClick, an `open` the dropdown's onOpenChange,
// a fill or select the input's onChange, a press the focused block's events (onPressEnter, a
// form's submit) or the event a block binds to the chord with `shortcut`.
const RAILED_STEPS = {
  click: { act: 'click it', step: 'a click' },
  open: { act: 'open it', step: 'an open' },
  fill: { act: 'fill it', step: 'a fill' },
  select: { act: 'select in it', step: 'a select' },
  press: { act: 'press a key that fires its events', step: 'a press' },
};

export default RAILED_STEPS;
