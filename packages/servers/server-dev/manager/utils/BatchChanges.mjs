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

import { type } from '@lowdefy/helpers';

class BatchChanges {
  constructor({ context, fn, delay }) {
    this.context = context;
    this._call = this._call.bind(this);
    this.args = [];
    this.delay = delay || 500;
    this.fn = fn;
    this.repeat = false;
    this.running = false;
  }

  newChange(...args) {
    this.args.push(args.filter((arg) => type.isString(arg))); // filter for string paths since chokidar also returns an stats object on windows.
    this._startTimer();
  }

  _startTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.running) {
      this.repeat = true;
    } else {
      this.timer = setTimeout(this._call, this.delay);
    }
  }

  async _call() {
    this.running = true;
    try {
      const args = this.args;
      this.args = [];
      await this.fn(args);
      this.running = false;
      if (this.repeat) {
        this.repeat = false;
        this._call();
      }
    } catch (error) {
      this.running = false;
      this.context.logger.error(error?.message ?? error);
    }
  }
}

export default BatchChanges;
