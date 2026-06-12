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

import { serializer } from '@lowdefy/helpers';

// Stable serialization used to compare selector values by identity — both when matching the
// current value to an option (getSelectedIndex) and when de-duplicating options
// (getSelectorOptions). The two must agree, so they share this function.
//
// Build-time location markers (`~k`, `~r`, `~l`) record where a value sits in the config, not its
// identity. The same option value carries a different marker depending on where it appears, and a
// value arriving from state or a request carries none — so a marker-sensitive compare would wrongly
// treat equal values as different (e.g. a config-literal option vs the same value pre-populated in
// state). `skipMarkers` only drops these markers when they are non-enumerable; markers loaded from
// the built JSON config are enumerable, so we also strip them via the replacer. Type markers
// (`~d` dates, `~e` errors) are part of the value and must be preserved.
const locationMarkers = new Set(['~k', '~r', '~l']);
const dropMarkers = (key, value) => (locationMarkers.has(key) ? undefined : value);

const serializeSelectorValue = (value) =>
  serializer.serializeToString(value, { stable: true, skipMarkers: true, replacer: dropMarkers });

export default serializeSelectorValue;
