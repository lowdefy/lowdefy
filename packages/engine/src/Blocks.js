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

import { applyArrayIndices, get, serializer, set, swap, type } from '@lowdefy/helpers';

import BlockActions from './BlockActions';
import getFieldValues from './getFieldValues';

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
      block.validate = type.isArray(block.validate) ? block.validate : [];
      block.properties = type.isNone(block.properties) ? {} : block.properties;
      block.style = type.isNone(block.style) ? {} : block.style;
      block.layout = type.isNone(block.layout) ? {} : block.layout;
      block.actions = type.isNone(block.actions) ? {} : block.actions;

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
        let blockValue = get(initState, block.field);
        if (type.isUndefined(blockValue)) {
          // default null value for block type
          blockValue = type.enforceType(block.meta.valueType, null);
          this.context.State.set(block.field, block.value);
          block.update = true;
        }
        if (get(block, 'meta.category') === 'list') {
          // load list value into list blocks
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
      } else if (
        get(block, 'meta.category') === 'container' ||
        // do not make sub blocks for sub contexts
        (get(block, 'meta.category') === 'context' && this === this.context.RootBlocks)
      ) {
        if (!type.isArray(this.subBlocks[block.id])) {
          this.subBlocks[block.id] = [];
        }
        if (!this.subBlocks[block.id][0]) {
          this.subBlocks[block.id].push(this.newBlocks(this.arrayIndices, block, initState));
        } else {
          this.subBlocks[block.id][0].reset(initState);
        }
      }
    });
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

  // used for update comparison
  static blockEvalToString(block) {
    return serializer.serializeToString({
      areasLayoutEval: block.areasLayoutEval,
      layoutEval: block.layoutEval,
      propertiesEval: block.propertiesEval,
      requiredEval: block.requiredEval,
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
        const stateValue = get(this.context.state, block.field);
        // enforce type here? should we reassign value here??
        block.value = type.isUndefined(stateValue) ? block.value : stateValue;
      }
      const beforeVisible = block.visibleEval ? block.visibleEval.output : true;
      if (!visibleParent) {
        block.visibleEval.output = false;
      } else {
        block.visibleEval = this.context.parser.parse({
          input: block.visible,
          location: block.blockId,
          arrayIndices: this.arrayIndices,
        }); // run parser on index combinations to get visible value object
      }
      if (beforeVisible !== block.visibleEval.output) {
        repeat = true;
      }
      // only evaluate visible blocks
      if (block.visibleEval.output) {
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
            : 'This field is required',
        };
        const validation =
          block.required === false ? block.validate : [requiredValidation, ...block.validate];
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
          const parsed = this.context.parser.parse({
            input: test,
            location: block.blockId,
            arrayIndices: this.arrayIndices,
          });
          // for parser errors
          if (parsed.errors.length > 0) {
            block.validationEval.errors.output.push(parsed.output.message);
            block.validationEval.errors.push(parsed.errors);
            validationError = true;
            return;
          }
          // failed validation
          if (!parsed.output.pass) {
            block.validationEval.output.push(parsed.output);
            if (test.status === 'error') {
              block.validationEval.output.errors.push(parsed.output.message);
              validationError = true;
            }
            if (test.status === 'warning') {
              block.validationEval.output.errors.push(parsed.output.message);
              validationWarning = true;
            }
          }
        });
        if (this.context.showValidationErrors && validation.length > 0) {
          block.validationEval.output.status = 'success';
        }
        if (validationWarning) {
          block.validationEval.output.status = 'warning';
        }
        if (this.context.showValidationErrors && validationError) {
          block.validationEval.output.status = 'error';
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
      }
      if (
        get(block, 'meta.category') === 'container' ||
        get(block, 'meta.category') === 'context' ||
        get(block, 'meta.category') === 'list'
      ) {
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
      if (block.validationEval.output.status === 'error' && block.visibleEval.output) {
        result.push({
          blockId: block.blockId,
          validation: block.validationEval.output,
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
    this.update(); // update to recalculate validationEval with showValidationErrors set to raise block errors
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
          validation: block.validationEval.output,
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
