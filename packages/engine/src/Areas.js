/* eslint-disable no-param-reassign */

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

import { applyArrayIndices, get, serializer, swap, type } from '@lowdefy/helpers';

class Areas {
  // TODO: Have separate class for single area and different class for Areas
  constructor({ arrayIndices = [], areas, context }) {
    this.id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substring(0, 5);
    this.areas = serializer.copy(areas || {});
    this.arrayIndices = arrayIndices;
    this.context = context;
    this.map = {};
    this.recCount = 0;
    this.blocks = {};

    // bind current instance
    this.getValidateRec = this.getValidateRec.bind(this);
    this.init = this.init.bind(this);
    this.newBlocks = this.newBlocks.bind(this);
    this.recContainerDelState = this.recContainerDelState.bind(this);
    this.recEval = this.recEval.bind(this);
    this.recRemoveBlocksFromMap = this.recRemoveBlocksFromMap.bind(this);
    this.recSetUndefined = this.recSetUndefined.bind(this);
    this.recUpdateArrayIndices = this.recUpdateArrayIndices.bind(this);
    this.reset = this.reset.bind(this);
    this.resetValidation = this.resetValidation.bind(this);
    this.resetValidationRec = this.resetValidationRec.bind(this);
    this.setBlocksCache = this.setBlocksCache.bind(this);
    this.update = this.update.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateStateFromRoot = this.updateStateFromRoot.bind(this);
    this.validate = this.validate.bind(this);
  }

  loopBlocks(fn) {
    if (type.isObject(this.areas)) {
      Object.keys(this.areas).forEach((key) => {
        if (type.isArray(this.areas[key].blocks)) {
          this.areas[key].blocks.forEach(fn);
        }
      });
    }
  }

  reset(initWithState) {
    const initState = serializer.copy(initWithState || this.context.state);
    this.loopBlocks((block) => {
      block.reset(initState);
    });
  }
}

export default Areas;
