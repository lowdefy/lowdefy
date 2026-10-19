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

import { unset, get, joinPath, serializer, set, splitPath, swap, type } from '@lowdefy/helpers';

import valuesEqual from './tracking/valuesEqual.js';

class State {
  constructor(context) {
    this.context = context;
    this.frozenState = null;
    this.initialized = false;

    this.set = this.set.bind(this);
    this.republish = this.republish.bind(this);
    this.del = this.del.bind(this);
    this.swapItems = this.swapItems.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.freezeState = this.freezeState.bind(this);
    this.resetState = this.resetState.bind(this);
  }

  // Every write reports the path it changed, so dependency-tracked updates re-evaluate the blocks
  // that read it.
  reportChange(field) {
    this.context._internal.DependencyTracker.reportChange(`state:${field}`);
  }

  resetState() {
    Object.keys(this.context.state).forEach((key) => {
      delete this.context.state[key];
    });
    this.context._internal.DependencyTracker.reportChange('state:*');
    const frozenCopy = serializer.deserializeFromString(this.frozenState);
    Object.keys(frozenCopy).forEach((key) => {
      this.set(key, frozenCopy[key]);
    });
  }

  freezeState() {
    if (!this.initialized) {
      this.frozenState = serializer.serializeToString(this.context.state);
      this.initialized = true;
    }
  }

  // An explicit write: setValue, SetState, list operations and tools. Always reported, even when the
  // value is the same object, since a caller may have mutated it in place.
  set(field, value) {
    set(this.context.state, field, value);
    this.reportChange(field);
  }

  // The engine writing a value back that state may already hold (input values, container
  // defaults, restored hidden list values). Written as before, but reported only when the value
  // differs, so a pass that changes nothing leaves no changes behind.
  republish(field, value) {
    const unchanged = valuesEqual(get(this.context.state, field), value);
    set(this.context.state, field, value);
    if (!unchanged) {
      this.reportChange(field);
    }
  }

  del(field) {
    const existed = !type.isUndefined(get(this.context.state, field));
    unset(this.context.state, field);
    if (existed) {
      this.reportChange(field);
    }
    // remove all empty objects from state as an effect of deleted values
    const fields = splitPath(field);
    if (fields.length > 1) {
      const parent = joinPath(fields.slice(0, -1));
      const parentValue = get(this.context.state, parent);
      if (type.isObject(parentValue) && Object.keys(parentValue).length === 0) {
        this.del(parent);
      }
    }
  }

  swapItems(field, from, to) {
    const arr = get(this.context.state, field);
    if (!type.isArray(arr) || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
      return;
    }
    swap(arr, from, to);
    this.reportChange(field);
  }

  removeItem(field, index) {
    const arr = get(this.context.state, field);
    if (!type.isArray(arr) || index < 0 || index >= arr.length) {
      return;
    }
    arr.splice(index, 1);
    this.reportChange(field);
  }
}

export default State;
