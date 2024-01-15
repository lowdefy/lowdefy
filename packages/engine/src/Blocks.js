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

import Events from './Events.js';

class Blocks {
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
    this.subBlocks = {};

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

  init(initState) {
    this.loopBlocks((block) => {
      block.idPattern = block.id;
      block.blockIdPattern = block.blockId;
      block.id = applyArrayIndices(this.arrayIndices, block.idPattern);
      block.blockId = applyArrayIndices(this.arrayIndices, block.blockIdPattern);
      // CAUTION:
      // map is not a direct reference to all blocks, blocks with duplicate ids will be overwritten in map
      // which can cause issues with ambiguous config during call method since it will call only the method
      // of the last initialized block for the referenced id.
      this.context._internal.RootBlocks.map[block.blockId] = block;
      block.events = type.isNone(block.events) ? {} : block.events;
      block.layout = type.isNone(block.layout) ? {} : block.layout;
      block.loading = type.isNone(block.loading) ? false : block.loading;
      block.properties = type.isNone(block.properties) ? {} : block.properties;
      block.required = type.isNone(block.required) ? false : block.required;
      block.skeleton = type.isNone(block.skeleton) ? null : block.skeleton;
      block.style = type.isNone(block.style) ? {} : block.style;
      block.validate = type.isNone(block.validate) ? [] : block.validate;
      block.visible = type.isNone(block.visible) ? true : block.visible;

      block.areasLayoutEval = {};
      block.layoutEval = {};
      block.loadingEval = {};
      block.propertiesEval = {};
      block.requiredEval = {};
      block.skeletonEval = {};
      block.styleEval = {};
      block.validationEval = {};
      block.visibleEval = {};
      try {
        block.meta = this.context._internal.lowdefy._internal.blockComponents[block.type].meta;
      } catch (error) {
        throw new Error(
          `Block type ${block.type} not found at ${block.blockId}. Check your plugins to make sure the block is installed. For more info, see https://docs.lowdefy.com/plugins.`
        );
      }
      if (
        block.meta?.category !== 'container' &&
        block.meta?.category !== 'display' &&
        block.meta?.category !== 'input' &&
        block.meta?.category !== 'list'
      ) {
        throw new Error(
          `Block type ${block.type}.meta.category must be either "container", "display", "input" or "list".`
        );
      }

      if (!type.isNone(block.areas)) {
        block.areasLayout = {};
        Object.keys(block.areas).forEach((key) => {
          // eslint-disable-next-line no-unused-vars
          const { blocks, ...areaLayout } = block.areas[key];
          block.areasLayout[key] = { ...areaLayout };
        });
      } else {
        block.areasLayout = {};
      }

      block.methods = {};
      block.registerMethod = (methodName, method) => {
        block.methods[methodName] = method;
      };
      if (block.meta.category === 'list') {
        // TODO: to initialize new object in array, the new value should be passed by method to unshiftItem and pushItem
        block.unshiftItem = () => {
          this.subBlocks[block.id].forEach((bl, i) => {
            bl.recUpdateArrayIndices(
              this.arrayIndices.concat([i]),
              this.arrayIndices.concat([i + 1])
            );
          });
          this.subBlocks[block.id].unshift(
            this.newBlocks({ arrayIndices: this.arrayIndices.concat([0]), block, initState: {} })
          );
          this.context._internal.State.set(block.blockId, undefined);
          // set block and subBlock values undefined, so as not to pass values to new blocks
          this.subBlocks[block.id][0].recSetUndefined();
          block.update = true;
          this.context._internal.update();
        };

        block.pushItem = () => {
          this.subBlocks[block.id].push(
            this.newBlocks({
              arrayIndices: this.arrayIndices.concat([this.subBlocks[block.id].length]),
              block,
              initState: {},
            })
          );
          block.update = true;
          this.context._internal.update();
        };

        block.removeItem = (index) => {
          this.context._internal.State.removeItem(block.blockId, index);
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
          this.context._internal.update();
        };

        block.moveItemUp = (index) => {
          if (index === 0) return;
          this.context._internal.State.swapItems(block.blockId, index - 1, index);
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
          this.context._internal.update();
        };

        block.moveItemDown = (index) => {
          if (index === this.subBlocks[block.id].length - 1) return;
          this.context._internal.State.swapItems(block.blockId, index, index + 1);
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
          this.context._internal.update();
        };
      }
      if (block.meta.category === 'input') {
        block.setValue = (value) => {
          block.value = type.enforceType(block.meta.valueType, value);

          this.context._internal.State.set(block.blockId, block.value);
          block.update = true;
          this.context._internal.update();
        };
      }

      block.Events = new Events({
        arrayIndices: this.arrayIndices,
        block,
        context: this.context,
      });
      block.triggerEvent = block.Events.triggerEvent;
      block.registerEvent = block.Events.registerEvent;
    });
    this.reset(initState); // set initial values to blocks.
  }

  reset(initWithState) {
    const initState = serializer.copy(initWithState || this.context.state);
    this.loopBlocks((block) => {
      block.update = true;
      block.showValidation = false;
      if (block.meta.category === 'input' || block.meta.category === 'list') {
        let blockValue = get(initState, block.blockId);
        if (type.isUndefined(blockValue)) {
          // default null value for block type
          blockValue = type.isUndefined(block.meta.initValue)
            ? type.enforceType(block.meta.valueType, null)
            : block.meta.initValue;
          this.context._internal.State.set(block.blockId, blockValue);
        }
        if (block.meta.category === 'list') {
          // load list value into list blocks
          if (!type.isArray(this.subBlocks[block.id])) {
            this.subBlocks[block.id] = [];
          }
          if (type.isArray(blockValue)) {
            blockValue.forEach((item, i) => {
              if (!this.subBlocks[block.id][i]) {
                this.subBlocks[block.id].push(
                  this.newBlocks({ arrayIndices: this.arrayIndices.concat([i]), block, initState })
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
      } else if (block.meta.category === 'container') {
        if (!type.isArray(this.subBlocks[block.id])) {
          this.subBlocks[block.id] = [];
        }
        if (!this.subBlocks[block.id][0]) {
          this.subBlocks[block.id].push(
            this.newBlocks({ arrayIndices: this.arrayIndices, block, initState })
          );
        } else {
          this.subBlocks[block.id][0].reset(initState);
        }
      }
    });
  }

  newBlocks({ arrayIndices, block, initState }) {
    const SubBlocks = new Blocks({
      arrayIndices,
      areas: block.areas,
      context: this.context,
    });
    SubBlocks.init(initState);
    return SubBlocks;
  }

  // used for update comparison
  static blockEvalToString(block) {
    return serializer.serializeToString({
      areasLayoutEval: block.areasLayoutEval,
      layoutEval: block.layoutEval,
      loadingEval: block.loadingEval,
      propertiesEval: block.propertiesEval,
      requiredEval: block.requiredEval,
      skeletonEval: block.skeletonEval,
      styleEval: block.styleEval,
      validationEval: block.validationEval,
      value: block.value,
      visibleEval: block.visibleEval,
    });
  }

  recEval(visibleParent) {
    let repeat = false;
    this.loopBlocks((block) => {
      if (block.meta.category === 'input') {
        const stateValue = get(this.context.state, block.blockId);
        // TODO: related to #345
        // enforce type here? should we reassign value here??
        block.value = type.isUndefined(stateValue) ? block.value : stateValue;
      }
      const beforeVisible = block.visibleEval ? block.visibleEval.output : true;
      if (visibleParent === false) {
        block.visibleEval.output = false;
      } else {
        block.visibleEval = this.context._internal.parser.parse({
          input: block.visible,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        }); // run parser on index combinations to get visible value object
      }
      if (beforeVisible !== block.visibleEval.output) {
        repeat = true;
      }
      // only evaluate visible blocks
      if (block.visibleEval.output !== false) {
        block.propertiesEval = this.context._internal.parser.parse({
          input: block.properties,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        block.requiredEval = this.context._internal.parser.parse({
          input: block.required,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        const requiredValidation = {
          pass: { _not: { _type: 'none' } },
          status: 'error',
          message: type.isString(block.requiredEval.output)
            ? block.requiredEval.output
            : 'This field is required',
        };
        const validation =
          block.requiredEval.output === false
            ? block.validate
            : [...block.validate, requiredValidation];

        block.validationEval = {
          output: {
            status: null,
            errors: [],
            warnings: [],
          },
          errors: [],
        };
        let validationError = false;
        let validationWarning = false;
        validation.forEach((test) => {
          const parsed = this.context._internal.parser.parse({
            input: test,
            location: block.blockId,
            arrayIndices: this.arrayIndices,
          });
          // for parser errors
          if (parsed.errors.length > 0) {
            block.validationEval.output.errors.push(parsed.output.message);
            block.validationEval.errors.push(parsed.errors);
            validationError = true;
            return;
          }
          // failed validation
          if (!parsed.output.pass) {
            // no status indication on validation tests defaults to error
            if (!test.status || test.status === 'error') {
              block.validationEval.output.errors.push(parsed.output.message);
              validationError = true;
            }
            if (test.status === 'warning') {
              block.validationEval.output.warnings.push(parsed.output.message);
              validationWarning = true;
            }
          }
        });
        if (validation.length > 0) {
          block.validationEval.output.status = 'success';
        }
        if (validationWarning) {
          block.validationEval.output.status = 'warning';
        }
        if (validationError && block.showValidation) {
          block.validationEval.output.status = 'error';
        }

        block.styleEval = this.context._internal.parser.parse({
          input: block.style,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        block.layoutEval = this.context._internal.parser.parse({
          input: block.layout,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        block.loadingEval = this.context._internal.parser.parse({
          input: block.loading,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        block.skeletonEval = this.context._internal.parser.parse({
          input: block.skeleton,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
        block.areasLayoutEval = this.context._internal.parser.parse({
          input: block.areasLayout,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        });
      }
      if (block.meta.category === 'container' || block.meta.category === 'list') {
        if (this.subBlocks[block.id] && this.subBlocks[block.id].length > 0) {
          this.subBlocks[block.id].forEach((blockClass) => {
            repeat = blockClass.recEval(block.visibleEval.output) || repeat;
          });
        }
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
        if (block.meta.category === 'container' || block.meta.category === 'list') {
          if (this.subBlocks[block.id] && this.subBlocks[block.id].length > 0) {
            this.subBlocks[block.id].forEach((blockClass) => {
              blockClass.updateState();
            });
          } else {
            toSet.add(block.blockId);
            this.context._internal.State.set(
              block.blockId,
              type.enforceType(block.meta.valueType, null)
            );
          }
        } else if (block.meta.category === 'input') {
          toSet.add(block.blockId);
          this.context._internal.State.set(block.blockId, block.value);
        }
      } else if (block.meta.category === 'container') {
        this.subBlocks[block.id].forEach((blockClass) => {
          blockClass.recContainerDelState(toDelete);
        });
      } else {
        toDelete.add(block.blockId);
      }
    });
    toDelete.forEach((field) => {
      if (!toSet.has(field)) {
        this.context._internal.State.del(field);
      }
    });
  }

  recContainerDelState(toDelete) {
    this.loopBlocks((block) => {
      if (block.meta.category === 'container') {
        this.subBlocks[block.id].forEach((blockClass) => {
          blockClass.recContainerDelState(toDelete);
        });
      } else {
        toDelete.add(block.blockId);
      }
    });
  }

  updateStateFromRoot() {
    const repeat = this.recEval(true);
    this.updateState();
    if (repeat && this.recCount < 20) {
      this.recCount += 1;
      this.updateStateFromRoot();
    }
    this.recCount = 0;
  }

  recUpdateArrayIndices(oldIndices, newIndices) {
    newIndices.forEach((index, i) => {
      this.arrayIndices[i] = newIndices[i];
    });
    this.loopBlocks((block) => {
      block.blockId = applyArrayIndices(this.arrayIndices, block.blockIdPattern);
      this.context._internal.RootBlocks.map[block.blockId] = block;
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.recUpdateArrayIndices(oldIndices, newIndices);
      });
    });
  }

  getValidateRec(match, result) {
    this.loopBlocks((block) => {
      if (match(block.blockId)) {
        block.showValidation = true;
        block.update = true;
        if (
          block.visibleEval.output !== false &&
          block.validationEval.output &&
          block.validationEval.output.errors.length > 0
        ) {
          block.validationEval.output.status = 'error';
          result.push({
            blockId: block.blockId,
            validation: block.validationEval.output,
          });
        }
      }
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.getValidateRec(match, result);
      });
    });
    return result;
  }

  recSetUndefined() {
    this.loopBlocks((block) => {
      this.context._internal.State.set(block.blockId, undefined);
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.recSetUndefined();
      });
    });
  }

  recRemoveBlocksFromMap() {
    this.loopBlocks((block) => {
      delete this.context._internal.RootBlocks.map[block.blockId];
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.recRemoveBlocksFromMap();
      });
    });
  }

  validate(match) {
    this.updateStateFromRoot(); // update to recalculate validationEval to raise block errors
    const validationErrors = this.getValidateRec(match, []); // get all relevant raised block errors and set showValidation
    this.setBlocksCache(); // update cache to render
    return validationErrors;
  }

  resetValidationRec(match) {
    this.loopBlocks((block) => {
      if (match(block.blockId)) {
        block.showValidation = false;
        block.update = true;
      }
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.resetValidationRec(match);
      });
    });
  }

  resetValidation(match) {
    this.resetValidationRec(match);
    this.setBlocksCache();
  }

  update() {
    this.updateStateFromRoot(); // update all the blocks
    this.setBlocksCache(); // finally update cache
  }

  setBlocksCache() {
    this.loopBlocks((block) => {
      if (block.update) {
        block.update = false;
        block.eval = {
          areas: block.areasLayoutEval.output,
          events: type.isNone(block.Events.events) ? null : block.Events.events,
          properties: block.propertiesEval.output,
          loading: block.loadingEval.output,
          skeleton: block.skeletonEval.output,
          required: block.requiredEval.output,
          layout: block.layoutEval.output,
          style: block.styleEval.output,
          validation: {
            ...(block.validationEval.output || {}),
            status:
              block.showValidation || block.validationEval.output?.status === 'warning'
                ? block.validationEval.output?.status
                : null,
          },
          value: type.isNone(block.value) ? null : block.value,
          visible: block.visibleEval.output,
        };
        this.context._internal.lowdefy._internal.updateBlock(block.id);
      }
    });
    Object.keys(this.subBlocks).forEach((subKey) => {
      this.subBlocks[subKey].forEach((subBlock) => {
        subBlock.setBlocksCache();
      });
    });
  }
}

export default Blocks;
