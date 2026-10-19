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

import isDependencyTrackingEnabled from './isDependencyTrackingEnabled.js';
import normalizeTrackingKey from './normalizeTrackingKey.js';
import ReadRecorder from './ReadRecorder.js';

// Per-context bookkeeping for dependency-tracked evaluation.
//
// Reads: while a block evaluates itself, context._internal.readRecorder is that evaluation's
// recorder, and null at every other time (actions, request payloads, render-time _function calls).
// Recorders stack, so a nested evaluation can never leak its reads into an outer one.
//
// Changes: every writer of a tracked namespace reports the keys it wrote, whether or not it runs an
// update itself. update({ changes }) runs a tracked pass over the changes reported since the last
// pass; a bare update() is a full pass, because its caller cannot say what changed. A writer that
// cannot report precisely asks for a full pass with requireFullUpdate. Changes reported during a
// pass (the engine's own republish writes) carry into the next pass.
class DependencyTracker {
  // Test switch, like WebParser.compileThreshold: test:full sets it false to run the engine suite
  // with every update a full pass.
  static enabled = true;

  constructor(context) {
    this.context = context;
    this.changes = new Set();
    this.fullPending = false;
    this.recorders = [];
    // Whether evaluations in the current update record their reads. Off when tracking is switched
    // off, so a full-pass-only session pays nothing for recording.
    this.recording = false;

    this.beginUpdate = this.beginUpdate.bind(this);
    this.isEnabled = this.isEnabled.bind(this);
    this.reportChange = this.reportChange.bind(this);
    this.reportChanges = this.reportChanges.bind(this);
    this.requireFullUpdate = this.requireFullUpdate.bind(this);
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.takeChanges = this.takeChanges.bind(this);

    this.context._internal.readRecorder = null;
  }

  isEnabled() {
    return (
      DependencyTracker.enabled &&
      isDependencyTrackingEnabled({ lowdefy: this.context._internal.lowdefy })
    );
  }

  reportChange(key) {
    this.changes.add(normalizeTrackingKey(key));
  }

  reportChanges(keys) {
    keys.forEach(this.reportChange);
  }

  requireFullUpdate() {
    this.fullPending = true;
  }

  // Starts an update and returns how its first pass runs: { full, changes }.
  beginUpdate({ changes } = {}) {
    const enabled = this.isEnabled();
    const tracked = type.isArray(changes) && !this.fullPending && enabled;
    if (type.isArray(changes)) {
      this.reportChanges(changes);
    }
    this.fullPending = false;
    this.recording = enabled;
    return { full: !tracked, changes: this.takeChanges() };
  }

  // The changes reported since the last take. A pass consumes them: every block it evaluates reads
  // the state as it is after them.
  takeChanges() {
    const changes = [...this.changes];
    this.changes.clear();
    return changes;
  }

  // Returns null when this update does not record.
  startRecording() {
    if (!this.recording) {
      return null;
    }
    const recorder = new ReadRecorder();
    this.recorders.push(recorder);
    this.context._internal.readRecorder = recorder;
    return recorder;
  }

  stopRecording(recorder) {
    if (recorder === null) {
      return;
    }
    this.recorders.pop();
    this.context._internal.readRecorder =
      this.recorders.length > 0 ? this.recorders[this.recorders.length - 1] : null;
  }
}

export default DependencyTracker;
