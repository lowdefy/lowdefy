/* eslint-disable no-param-reassign */

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

import { serializer, type } from '@lowdefy/helpers';
import Block from './Block.js';

class Slots {
  constructor({ arrayIndices = [], slots, context }) {
    this.id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substring(0, 5);
    this.slots = serializer.copy(slots || []);
    this.arrayIndices = arrayIndices;
    this.context = context;
    this.map = {};
    this.recCount = 0;
    this.subSlots = {};
  }

  init = (initState) => {
    this.initSlotBlocks();
    this.loopBlocks((block) => {
      this.context._internal.RootSlots.map[block.blockId] = block;
    });
    this.reset(initState);
  };

  // Replace Slot blocks array with Block instances
  initSlotBlocks = () => {
    if (type.isObject(this.slots)) {
      Object.values(this.slots).forEach((slot) => {
        // Handle slots with no blocks - render as empty
        const blocksConfig = slot.blocks ?? [];
        const blocks = blocksConfig.map((slotBlock) => new Block(this, slotBlock));
        slot.blocks = blocks;
      });
    }
  };

  loopBlocks = (fn) => {
    if (type.isObject(this.slots)) {
      Object.values(this.slots).forEach((slotArray) => {
        if (type.isArray(slotArray.blocks)) {
          slotArray.blocks.forEach(fn);
        }
      });
    }
  };

  loopSubSlots = (fn) => {
    Object.values(this.subSlots).forEach((subSlotsArray) => {
      subSlotsArray.forEach(fn);
    });
  };

  reset = (initWithState) => {
    const initState = serializer.copy(initWithState || this.context.state);
    this.loopBlocks((block) => {
      block.reset(this.subSlots, initState);
    });
  };

  recEval = (visibleParent) => {
    let repeat = { value: false };
    this.loopBlocks((block) => block.evaluate(visibleParent, repeat));
    return repeat.value;
  };

  updateState = () => {
    const toDelete = new Set();
    const toSet = new Set(); // If block with duplicate blockId is visible, we preserve the state for it.
    this.loopBlocks((block) => {
      if (!block.isVisible()) {
        if (block.isContainer()) {
          block.loopSubSlots((subSlotsClass) => subSlotsClass.recContainerDelState(toDelete));
        }
        toDelete.add(block.blockId);
      } else {
        block.updateState(toSet);
      }
    });
    toDelete.forEach((field) => {
      if (!toSet.has(field)) this.context._internal.State.del(field);
    });
  };

  recContainerDelState = (toDelete) => {
    this.loopBlocks((block) => {
      if (block.isContainer()) {
        block.loopSubSlots((subSlotsClass) => subSlotsClass.recContainerDelState(toDelete));
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
    this.loopSubSlots((subSlotsClass) =>
      subSlotsClass.recUpdateArrayIndices(oldIndices, newIndices)
    );
  };

  getValidateRec = (match, result) => {
    this.loopBlocks((block) => {
      const getValidate = block.getValidate(match);
      if (!type.isNone(getValidate)) result.push(getValidate);
    });

    this.loopSubSlots((subSlotsClass) => subSlotsClass.getValidateRec(match, result));
    return result;
  };

  recSetUndefined = () => {
    this.loopBlocks((block) => {
      this.context._internal.State.set(block.blockId, undefined);
    });

    this.loopSubSlots((subSlotsClass) => subSlotsClass.recSetUndefined());
  };

  recRemoveBlocksFromMap = () => {
    this.loopBlocks((block) => block.deleteFromMap());
    this.loopSubSlots((subSlotsClass) => subSlotsClass.recRemoveBlocksFromMap());
  };

  validate = (match) => {
    this.updateStateFromRoot(); // update to recalculate validationEval to raise block errors
    const validationErrors = this.getValidateRec(match, []); // get all relevant raised block errors and set showValidation
    this.renderBlocks(); // update cache to render
    return validationErrors;
  };

  resetValidationRec = (match) => {
    this.loopBlocks((block) => block.resetValidation(match));
    this.loopSubSlots((subSlotsClass) => subSlotsClass.resetValidationRec(match));
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
    this.loopSubSlots((subSlotsClass) => subSlotsClass.renderBlocks());
  };
}

export default Slots;
