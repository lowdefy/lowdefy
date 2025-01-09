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

import { serializer, type } from '@lowdefy/helpers';
import Block from './Block.js';

class Areas {
  constructor({ arrayIndices = [], areas, context }) {
    this.id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substring(0, 5);
    this.areas = serializer.copy(areas || []);
    this.arrayIndices = arrayIndices;
    this.context = context;
    this.map = {};
    this.recCount = 0;
    this.subAreas = {};
  }

  init = (initState) => {
    this.initAreaBlocks();
    this.loopBlocks((block) => {
      this.context._internal.RootBlocks.map[block.blockId] = block;
    });
    this.reset(initState);
  };

  // Replace Area blocks array with Block instances
  initAreaBlocks = () => {
    if (type.isObject(this.areas)) {
      Object.keys(this.areas).forEach((areaKey) => {
        const blocks = this.areas[areaKey].blocks.map((areaBlock) => new Block(this, areaBlock));
        this.areas[areaKey].blocks = blocks;
      });
    }
  };

  loopBlocks = (fn) => {
    if (type.isObject(this.areas)) {
      Object.values(this.areas).forEach((areaArray) => {
        if (type.isArray(areaArray.blocks)) {
          areaArray.blocks.forEach(fn);
        }
      });
    }
  };

  loopSubAreas = (fn) => {
    Object.values(this.subAreas).forEach((subAreasArray) => {
      subAreasArray.forEach(fn);
    });
  };

  reset = (initWithState) => {
    const initState = serializer.copy(initWithState || this.context.state);
    this.loopBlocks((block) => {
      block.reset(this.subAreas, initState);
    });
  };

  recEval = (visibleParent) => {
    let repeat = { value: false };
    this.loopBlocks((block) => block.evaluate(visibleParent, repeat));
    return repeat.value;
  };

  updateState = () => {
    const toSet = new Set();
    const toDelete = new Set();
    this.loopBlocks((block) => {
      if (!block.visibleEval.output && block.isContainer()) {
        block.loopSubAreas((subAreasClass) => subAreasClass.recContainerDelState(toDelete));
      }
      // TODO: Make better
      const op = block.updateState();
      if (op === 'set') {
        toSet.add(block.blockId);
      } else if (op === 'delete') {
        toDelete.add(block.blockId);
      }
    });
    toDelete.forEach((field) => {
      if (!toSet.has(field)) {
        this.context._internal.State.del(field);
      }
    });
  };

  recContainerDelState = (toDelete) => {
    this.loopBlocks((block) => {
      if (block.isContainer()) {
        this.loopSubAreas((subAreasClass) => subAreasClass.recContainerDelState(toDelete));
      } else {
        toDelete.add(block.blockId);
      }
    });
  };

  updateStateFromRoot = () => {
    const repeat = this.recEval(true);
    this.updateState();
    if (repeat && this.recCount < 20) {
      this.recCount += 1;
      this.updateStateFromRoot();
    }
    this.recCount = 0;
  };

  recUpdateArrayIndices = (oldIndices, newIndices) => {
    newIndices.forEach((index, i) => {
      this.arrayIndices[i] = newIndices[i];
    });
    this.loopBlocks((block) => block.updateArrayIndices());
    this.loopSubAreas((subAreasClass) =>
      subAreasClass.recUpdateArrayIndices(oldIndices, newIndices)
    );
  };

  getValidateRec = (match, result) => {
    this.loopBlocks((block) => {
      const getValidate = block.getValidate(match);
      if (!type.isNone(getValidate)) result.push(getValidate);
    });

    this.loopSubAreas((subAreasClass) => subAreasClass.getValidateRec(match, result));
    return result;
  };

  recSetUndefined = () => {
    this.loopBlocks((block) => {
      this.context._internal.State.set(block.blockId, undefined);
    });

    this.loopSubAreas((subAreasClass) => subAreasClass.recSetUndefined());
  };

  recRemoveBlocksFromMap = () => {
    this.loopBlocks((block) => block.deleteFromMap());
    this.loopSubAreas((subAreasClass) => subAreasClass.recRemoveBlocksFromMap());
  };

  validate = (match) => {
    this.updateStateFromRoot(); // update to recalculate validationEval to raise block errors
    const validationErrors = this.getValidateRec(match, []); // get all relevant raised block errors and set showValidation
    this.renderBlocks(); // update cache to render
    return validationErrors;
  };

  resetValidationRec = (match) => {
    this.loopBlocks((block) => block.resetValidation(match));
    this.loopSubAreas((subAreasClass) => subAreasClass.resetValidationRec(match));
  };

  resetValidation = (match) => {
    this.resetValidationRec(match);
    this.renderBlocks();
  };

  update = () => {
    this.updateStateFromRoot(); // update all the blocks
    this.renderBlocks(); // finally update cache
  };

  renderBlocks = () => {
    this.loopBlocks((block) => block.render());
    this.loopSubAreas((subAreasClass) => subAreasClass.renderBlocks());
  };
}

export default Areas;
