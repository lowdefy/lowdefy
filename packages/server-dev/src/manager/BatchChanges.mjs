/*
  Copyright 2020-2021 Lowdefy, Inc

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

class BatchChanges {
  constructor({ fn, minDelay }) {
    this.args = [];
    this.fn = fn;
    this.delay = minDelay || 500;
    this.minDelay = minDelay || 500;
    this._call = this._call.bind(this);
  }

  newChange(args) {
    this.args.push(args);
    this.delay = this.minDelay;
    this._startTimer();
  }

  _startTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(this._call, this.delay);
  }

  async _call() {
    try {
      const args = this.args;
      this.args = [];
      await this.fn(args);
    } catch (error) {
      console.error(error);
      this.delay *= 2;
      console.warn(`Retrying in ${this.delay / 1000}s.`, { timestamp: true });
      this._startTimer();
    }
  }
}

export default BatchChanges;
