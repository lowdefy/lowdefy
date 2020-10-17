/* eslint-disable no-param-reassign */

/*
  Copyright 2020 Lowdefy, Inc

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

import type from '@lowdefy/type';
import get from '@lowdefy/get';
import set from '@lowdefy/set';
import { applyArrayIndices } from '@lowdefy/helpers';
import serializer from '@lowdefy/serializer';

import BlockActions from './BlockActions';
import getFieldValues from './getFieldValues';
import swap from './swap';

class Blocks {
  constructor({ arrayIndices, areas, context }) {
    this.id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5);
    this.context = context;
    this.areas = serializer.copy(areas || []);
    this.arrayIndices = type.isArray(arrayIndices) ? arrayIndices : [];
    this.subBlocks = {};
    this.map = {};
    this.recCount = 0;
    this.init = this.init.bind(this);
    this.reset = this.reset.bind(this);
    this.recEval = this.recEval.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateStateFromRoot = this.updateStateFromRoot.bind(this);
    this.setBlocksCache = this.setBlocksCache.bind(this);
    this.setUndefinedValuesToState = this.setUndefinedValuesToState.bind(this);
    this.recContainerDelState = this.recContainerDelState.bind(this);
    this.recUpdateArrayIndices = this.recUpdateArrayIndices.bind(this);
    this.recSetUndefined = this.recSetUndefined.bind(this);
    this.newBlocks = this.newBlocks.bind(this);
    this.getValidateRec = this.getValidateRec.bind(this);
    this.setBlocksLoadingCache = this.setBlocksLoadingCache.bind(this);
    this.generateBlockId = this.generateBlockId.bind(this);
    this.update = this.update.bind(this);
    this.validate = this.validate.bind(this);
    this.recRemoveBlocksFromMap = this.recRemoveBlocksFromMap.bind(this);
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

  init(initState) {
    this.loopBlocks((block) => {
      block.blockIdPattern = block.blockId;
      block.id = this.generateBlockId(block.blockIdPattern);
      block.fieldPattern = block.field;
      block.blockId = applyArrayIndices(this.arrayIndices, block.blockIdPattern);
      this.context.RootBlocks.map[block.blockId] = block;
      block.field = !type.isNone(block.fieldPattern)
        ? applyArrayIndices(this.arrayIndices, block.fieldPattern)
        : block.blockId;
      block.visible = type.isNone(block.visible) ? true : block.visible;
      block.required = type.isNone(block.required) ? false : block.required;
      block.validate = type.isNone(block.validate)
        ? []
        : type.isArray(block.validate)
        ? block.validate
        : [block.validate];
      block.properties = type.isNone(block.properties) ? {} : block.properties;
      block.style = type.isNone(block.style) ? {} : block.style;
      block.layout = type.isNone(block.layout) ? {} : block.layout;
      block.actions = type.isNone(block.actions) ? {} : block.actions;

      if (!type.isNone(block.areas)) {
        block.areasLayout = {};
        Object.keys(block.areas).forEach((key) => {
          const { blocks, ...areaLayout } = block.areas[key];
          block.areasLayout[key] = { ...areaLayout };
        });
      } else {
        block.areasLayout = {};
      }

      block.requestKeys = getFieldValues(
        '_request',
        block.style,
        block.properties,
        block.validate,
        block.visible,
        block.required
      );
      block.methods = {};
      block.registerMethod = (methodName, method) => {
        block.methods[methodName] = method;
      };

      if (get(block, 'meta.category') === 'list') {
        block.unshiftItem = () => {
          this.subBlocks[block.id].forEach((bl, i) => {
            bl.recUpdateArrayIndices(
              this.arrayIndices.concat([i]),
              this.arrayIndices.concat([i + 1])
            );
          });
          this.subBlocks[block.id].unshift(
            this.newBlocks(this.arrayIndices.concat([0]), block, {})
          );
          this.context.State.set(block.field, undefined);
          // set block and subBlock values undefined, so as not to pass values to new blocks
          this.subBlocks[block.id][0].recSetUndefined();
          block.update = true;
          this.context.update();
        };

        block.pushItem = () => {
          this.subBlocks[block.id].push(
            this.newBlocks(this.arrayIndices.concat([this.subBlocks[block.id].length]), block, {})
          );
          block.update = true;
          this.context.update();
        };

        block.removeItem = (index) => {
          this.context.State.removeItem(block.blockId, index);
          const lastBlock = this.subBlocks[block.id][this.subBlocks[block.id].length - 1];
          lastBlock.recRemoveBlocksFromMap();
          const largerBlocks = this.subBlocks[block.id].slice(index + 1);
          largerBlocks.forEach((bl, i) => {
            bl.recUpdateArrayIndices(
              this.arrayIndices.concat([index + i + 1]),
              this.arrayIndices.concat([index + i])
            );
          });
          this.subBlocks[block.id].splice(index, 1);

          block.update = true;
          this.context.update();
        };

        block.moveItemUp = (index) => {
          if (index === 0) return;
          this.context.State.swapItems(block.blockId, index - 1, index);
          this.subBlocks[block.id][index - 1].recUpdateArrayIndices(
            this.arrayIndices.concat([index - 1]),
            this.arrayIndices.concat([index])
          );
          this.subBlocks[block.id][index].recUpdateArrayIndices(
            this.arrayIndices.concat([index]),
            this.arrayIndices.concat([index - 1])
          );
          swap(this.subBlocks[block.id], index - 1, index);
          block.update = true;
          this.context.update();
        };

        block.moveItemDown = (index) => {
          if (index === this.subBlocks[block.id].length - 1) return;
          this.context.State.swapItems(block.blockId, index, index + 1);
          this.subBlocks[block.id][index + 1].recUpdateArrayIndices(
            this.arrayIndices.concat([index + 1]),
            this.arrayIndices.concat([index])
          );
          this.subBlocks[block.id][index].recUpdateArrayIndices(
            this.arrayIndices.concat([index]),
            this.arrayIndices.concat([index + 1])
          );
          swap(this.subBlocks[block.id], index, index + 1);
          block.update = true;
          this.context.update();
        };
      }
      if (get(block, 'meta.category') === 'input') {
        block.setValue = (value) => {
          block.value = type.enforceType(block.meta.valueType, value);
          this.context.State.set(block.field, block.value);
          block.update = true;
          this.context.update();
        };
      }

      block.BlockActions = new BlockActions({
        arrayIndices: this.arrayIndices,
        block,
        context: this.context,
      });
      block.callAction = block.BlockActions.callAction;
      block.registerAction = block.BlockActions.registerAction;
    });
    this.reset(initState); // set initial values to blocks.
  }

  reset(initWithState) {
    const initState = serializer.copy(initWithState || this.context.state);
    this.loopBlocks((block) => {
      block.update = true;
      if (get(block, 'meta.category') === 'input' || get(block, 'meta.category') === 'list') {
        const stateValue = get(initState, block.field);
        let blockValue;
        if (!type.isUndefined(stateValue)) {
          blockValue = stateValue;
        } else {
          const parsedBlockValue = this.context.parser.parse({
            input: type.enforceType(
              block.meta.valueType,
              get(block, 'defaultValue', { default: null })
            ),
            location: block.blockId,
            arrayIndices: this.arrayIndices,
          });
          // TODO: handel blockValue parse errors
          blockValue = parsedBlockValue.output;
          set(initState, block.field, blockValue); // pass defaultValues to subBlocks
        }
        if (get(block, 'meta.category') === 'list') {
          if (!type.isArray(this.subBlocks[block.id])) {
            this.subBlocks[block.id] = [];
          }
          if (type.isArray(blockValue)) {
            blockValue.forEach((item, i) => {
              if (!this.subBlocks[block.id][i]) {
                this.subBlocks[block.id].push(
                  this.newBlocks(this.arrayIndices.concat([i]), block, initState)
                );
              } else {
                this.subBlocks[block.id][i].reset(initState);
              }
            });
            this.subBlocks[block.id].splice(blockValue.length);
          }
        } else {
          block.value = blockValue;
        }
      } else if (get(block, 'meta.category') === 'container') {
        if (!type.isArray(this.subBlocks[block.id])) {
          this.subBlocks[block.id] = [];
        }
        if (!this.subBlocks[block.id][0]) {
          this.subBlocks[block.id].push(this.newBlocks(this.arrayIndices, block, initState));
        } else {
          this.subBlocks[block.id][0].reset(initState);
        }
      } else if (get(block, 'meta.category') === 'context') {
        if (this === this.context.RootBlocks) {
          if (!type.isArray(this.subBlocks[block.id])) {
            this.subBlocks[block.id] = [];
          }
          if (!this.subBlocks[block.id][0]) {
            this.subBlocks[block.id].push(this.newBlocks(this.arrayIndices, block, initState));
          } else {
            this.subBlocks[block.id][0].reset(initState);
          }
        }
      }
    });
    this.setUndefinedValuesToState(); // to get undefinedValues in state
  }

  newBlocks(arrayIndices, block, initState) {
    const SubBlocks = new Blocks({
      arrayIndices,
      areas: block.areas,
      context: this.context,
    });
    SubBlocks.init(initState);
    return SubBlocks;
  }

  static blockEvalToString(block) {
    return serializer.serializeToString({
      areasLayoutEval: block.areasLayoutEval,
      layoutEval: block.layoutEval,
      propertiesEval: block.propertiesEval,
      requiredEval: block.requiredEval,
      styleEval: block.styleEval,
      validateEval: block.validateEval,
      value: block.value,
      visibleEval: block.visibleEval,
    });
  }

  recEval() {
    let repeat = false;
    this.loopBlocks((block) => {
      if (block.meta.category === 'input') {
        const stateValue = get(this.context.state, block.field);
        // enforce type here? should we reassign value here??
        block.value = type.isUndefined(stateValue) ? block.value : stateValue;
      }
      block.propertiesEval = this.context.parser.parse({
        input: block.properties,
        location: block.blockId,
        arrayIndices: this.arrayIndices,
      });
      block.requiredEval = this.context.parser.parse({
        input: block.required,
        location: block.blockId,
        arrayIndices: this.arrayIndices,
      });
      const requiredValidation = {
        pass: { _not: { _type: 'none' } },
        status: 'error',
        message: type.isString(block.requiredEval.output)
          ? block.requiredEval.output
          : get(block, 'requiredEval.output.message', { default: 'This field is required' }),
      };
      const validation =
        block.required === false ? block.validate : [requiredValidation, ...block.validate];
      block.validateEval = {
        output: [],
        errors: [],
      };
      validation.forEach((test) => {
        const parsed = this.context.parser.parse({
          input: test,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        if (parsed.errors.length > 0) {
          block.validateEval.output.push({
            ...parsed.output,
            pass: false,
          });
          block.validateEval.errors.push(parsed.errors);
          return;
        }
        if (!parsed.output.pass) {
          block.validateEval.output.push(parsed.output);
          block.validateEval.errors.push(parsed.errors);
        }
      });

      // if page has not called Validate action clear errors
      if (!this.context.showValidationErrors) {
        block.validateEval.output = block.validateEval.output.filter(
          (val) => val.status && val.status !== 'error'
        );
      }
      block.styleEval = this.context.parser.parse({
        input: block.style,
        location: block.blockId,
        arrayIndices: this.arrayIndices,
      });
      block.layoutEval = this.context.parser.parse({
        input: block.layout,
        location: block.blockId,
        arrayIndices: this.arrayIndices,
      });
      block.areasLayoutEval = this.context.parser.parse({
        input: block.areasLayout,
        location: block.blockId,
        arrayIndices: this.arrayIndices,
      });
      const vis = block.visibleEval ? block.visibleEval.output : true;
      block.visibleEval = this.context.parser.parse({
        input: block.visible,
        location: block.blockId,
        arrayIndices: this.arrayIndices,
      }); // run parser on index combinations to get visible value object
      if (
        get(block, 'meta.category') === 'container' ||
        get(block, 'meta.category') === 'context' ||
        get(block, 'meta.category') === 'list'
      ) {
        if (this.subBlocks[block.id] && this.subBlocks[block.id].length > 0) {
          this.subBlocks[block.id].forEach((blockClass) => {
            repeat = blockClass.recEval() || repeat;
          });
        }
      }
      if (vis !== block.visibleEval.output) {
        repeat = true;
      }
      const after = Blocks.blockEvalToString(block);
      if (block.before !== after) {
        block.update = true;
        block.before = after;
      }
    });
    return repeat;
  }

  updateState() {
    const toSet = new Set();
    const toDelete = new Set();
    this.loopBlocks((block) => {
      if (block.visibleEval.output !== false) {
        if (
          get(block, 'meta.category') === 'container' ||
          get(block, 'meta.category') === 'context' ||
          get(block, 'meta.category') === 'list'
        ) {
          if (this.subBlocks[block.id] && this.subBlocks[block.id].length > 0) {
            this.subBlocks[block.id].forEach((blockClass) => {
              blockClass.updateState();
            });
          } else {
            toSet.add(block.field);
            this.context.State.set(block.field, type.enforceType(block.meta.valueType, null));
          }
        } else if (get(block, 'meta.category') === 'input') {
          toSet.add(block.field);
          this.context.State.set(block.field, block.value);
        }
      } else if (
        get(block, 'meta.category') === 'container' ||
        get(block, 'meta.category') === 'context'
      ) {
        this.subBlocks[block.id].forEach((blockClass) => {
          blockClass.recContainerDelState(toDelete);
        });
      } else {
        toDelete.add(block.field);
      }
    });
    toDelete.forEach((field) => {
      if (!toSet.has(field)) {
        this.context.State.del(field);
      }
    });
  }

  recContainerDelState(toDelete) {
    this.loopBlocks((block) => {
      if (
        get(block, 'meta.category') === 'container' ||
        get(block, 'meta.category') === 'context'
      ) {
        this.subBlocks[block.id].forEach((blockClass) => {
          blockClass.recContainerDelState(toDelete);
        });
      } else {
        toDelete.add(block.field);
      }
    });
  }

  updateStateFromRoot() {
    const repeat = this.recEval();
    this.updateState();
    if (repeat && this.recCount < 20) {
      this.recCount += 1;
      this.updateStateFromRoot();
    }
    this.recCount = 0;
  }

  setUndefinedValuesToState() {
    this.loopBlocks((block) => {
      if (get(block, 'meta.category') === 'input') {
        if (type.isUndefined(get(this.context.state, block.field))) {
          this.context.State.set(block.field, block.value);
        }
      }
    });
  }

  recUpdateArrayIndices(oldIndices, newIndices) {
    newIndices.forEach((index, i) => {
      this.arrayIndices[i] = newIndices[i];
    });
    this.loopBlocks((block) => {
      block.blockId = applyArrayIndices(this.arrayIndices, block.blockIdPattern);
      this.context.RootBlocks.map[block.blockId] = block;
      block.field = !type.isNone(block.fieldPattern)
        ? applyArrayIndices(this.arrayIndices, block.fieldPattern)
        : block.blockId;
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.recUpdateArrayIndices(oldIndices, newIndices);
      });
    });
  }

  getValidateRec(result) {
    this.loopBlocks((block) => {
      if (block.validateEval.output.length > 0 && block.visibleEval.output) {
        result.push({
          blockId: block.blockId,
          validate: block.validateEval.output,
        });
      }
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.getValidateRec(result);
      });
    });
    return result;
  }

  recSetUndefined() {
    this.loopBlocks((block) => {
      this.context.State.set(block.field, undefined);
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.recSetUndefined();
      });
    });
  }

  recRemoveBlocksFromMap() {
    this.loopBlocks((block) => {
      delete this.context.RootBlocks.map[block.blockId];
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.recRemoveBlocksFromMap();
      });
    });
  }

  validate() {
    this.update(); // update to recalculate validateEval with showValidationErrors set to raise block errors
    return this.getValidateRec([]);
  }

  update() {
    this.updateStateFromRoot(); // update all the blocks
    this.setBlocksCache(); // finally update cache
  }

  setBlocksCache() {
    this.loopBlocks((block) => {
      if (block.update) {
        block.update = false;
        block.loading = block.requestKeys.reduce(
          (acc, key) =>
            acc || (this.context.requests[key] ? this.context.requests[key].loading : true),
          false
        );
        block.eval = {
          areas: block.areasLayoutEval.output,
          actions: type.isNone(block.BlockActions.actions) ? null : block.BlockActions.actions,
          properties: block.propertiesEval.output,
          required: block.requiredEval.output,
          layout: block.layoutEval.output,
          style: block.styleEval.output,
          validate: block.validateEval.output,
          value: type.isNone(block.value) ? null : block.value,
          visible: block.visibleEval.output,
        };
        this.context.updateBlock(block.id);
      }
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.setBlocksCache();
      });
    });
  }

  setBlocksLoadingCache() {
    this.loopBlocks((block) => {
      block.loading_prev = block.loading;
      block.loading = block.requestKeys.reduce(
        (acc, key) =>
          acc || (this.context.requests[key] ? this.context.requests[key].loading : true),
        false
      );
      if (block.loading_prev !== block.loading) {
        this.context.updateBlock(block.id);
      }
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.setBlocksLoadingCache();
      });
    });
  }

  generateBlockId(blockIdPattern) {
    return `${this.context.pageId}:${blockIdPattern}:${Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 5)}`;
  }
}

export default Blocks;
