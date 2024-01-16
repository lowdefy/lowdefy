/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { unset, get, serializer, set, swap, type } from '@lowdefy/helpers';

class State {
  constructor(context) {
    this.context = context;
    this.frozenState = null;
    this.initialized = false;

    this.set = this.set.bind(this);
    this.del = this.del.bind(this);
    this.swapItems = this.swapItems.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.freezeState = this.freezeState.bind(this);
    this.resetState = this.resetState.bind(this);
  }

  resetState() {
    Object.keys(this.context.state).forEach((key) => {
      delete this.context.state[key];
    });
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

  set(field, value) {
    set(this.context.state, field, value);
  }

  del(field) {
    unset(this.context.state, field);
    // remove all empty objects from state as an effect of deleted values
    const fields = field.split('.');
    if (fields.length > 1) {
      const parent = fields.slice(0, fields.length - 1).join('.');
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
  }

  removeItem(field, index) {
    const arr = get(this.context.state, field);
    if (!type.isArray(arr) || index < 0 || index >= arr.length) {
      return;
    }
    arr.splice(index, 1);
  }
}

export default State;
