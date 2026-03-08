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

import { applyArrayIndices, get, serializer, swap, type } from '@lowdefy/helpers';
import Events from './Events.js';
import Slots from './Slots.js';

class Block {
  constructor({ context, arrayIndices }, blockConfig) {
    const {
      id,
      blockId,
      class: blockClass,
      events,
      layout,
      loading,
      properties,
      required,
      skeleton,
      style,
      styles,
      validate,
      visible,
      type: blockType,
      slots,
    } = blockConfig;

    this.context = context;
    this.arrayIndices = arrayIndices;
    this.configKey = blockConfig['~k'];

    this.idPattern = id;
    this.blockIdPattern = blockId;
    this.id = applyArrayIndices(this.arrayIndices, this.idPattern);
    this.blockId = applyArrayIndices(this.arrayIndices, this.blockIdPattern);

    this.events = type.isNone(events) ? {} : events;
    this.layout = type.isNone(layout) ? {} : layout;
    this.loading = type.isNone(loading) ? false : loading;
    this.properties = type.isNone(properties) ? {} : properties;
    this.required = type.isNone(required) ? false : required;
    this.skeleton = type.isNone(skeleton) ? null : skeleton;
    this.class = type.isNone(blockClass) ? {} : blockClass;
    this.style = type.isNone(style) ? {} : style;
    this.styles = type.isNone(styles) ? {} : styles;
    this.validate = type.isNone(validate) ? [] : validate;
    this.visible = type.isNone(visible) ? true : visible;
    this.type = blockType;
    this.slots = slots;

    this.slotsLayoutEval = {};
    this.classEval = {};
    this.layoutEval = {};
    this.loadingEval = {};
    this.propertiesEval = {};
    this.requiredEval = {};
    this.skeletonEval = {};
    this.styleEval = {};
    this.stylesEval = {};
    this.validationEval = {};
    this.visibleEval = {};

    try {
      this.meta = this.context._internal.lowdefy._internal.blockComponents[this.type].meta;
    } catch (error) {
      throw new Error(
        `Block type ${this.type} not found at ${this.blockId}. Check your plugins to make sure the block is installed. For more info, see https://docs.lowdefy.com/plugins.`,
        { cause: error }
      );
    }
    if (!this.isContainer() && !this.isDisplay() && !this.isInput() && !this.isList()) {
      throw new Error(
        `Block type ${this.type}.meta.category must be either "container", "display", "input", "list", or "input-container".`
      );
    }

    if (!type.isNone(slots)) {
      this.slotsLayout = {};
      Object.keys(slots).forEach((key) => {
        // eslint-disable-next-line no-unused-vars
        const { blocks, ...slotLayout } = slots[key];
        this.slotsLayout[key] = { ...slotLayout };
      });
    } else {
      this.slotsLayout = {};
    }

    this.methods = {};

    if (this.isList()) {
      this._initList();
    }
    if (this.isInput()) {
      this._initInput();
    }

    this.Events = new Events({
      arrayIndices: this.arrayIndices,
      block: this,
      context: this.context,
    });

    this.triggerEvent = this.Events.triggerEvent;
    this.registerEvent = this.Events.registerEvent;
  }

  _initInput = () => {
    this.setValue = (value) => {
      this.value = type.enforceType(this.meta.valueType, value);
      this.context._internal.State.set(this.blockId, this.value);
      this.update = true;
      this.context._internal.update();
    };
  };

  _initList = () => {
    this.unshiftItem = (initialValue) => {
      // Save current list state before wipe. Display blocks (Card, Paragraph) read
      // from state via _state operators and don't store values internally, so the
      // state wipe below would lose their data without this save/restore.
      const currentArr = get(this.context.state, this.blockId);
      const savedItems = type.isArray(currentArr)
        ? currentArr.map((item) => serializer.copy(item))
        : [];
      this.loopSubSlots((slotsClass, i) => {
        slotsClass.recUpdateArrayIndices(
          this.arrayIndices.concat([i]),
          this.arrayIndices.concat([i + 1])
        );
      });
      this.subSlots.unshift(
        this.newSlots({ arrayIndices: this.arrayIndices.concat([0]), initState: {} })
      );
      this.context._internal.State.set(this.blockId, undefined);
      // set slot block and sub slots values undefined, so as not to pass values to new blocks
      this.subSlots[0].recSetUndefined();
      // Restore shifted items at their new indices
      savedItems.forEach((item, i) => {
        this.context._internal.State.set(`${this.blockId}.${i + 1}`, item);
      });
      if (initialValue !== undefined) {
        this.context._internal.State.set(`${this.blockId}.0`, initialValue);
      }
      this.update = true;
      this.context._internal.update();
    };

    this.pushItem = (initialValue) => {
      const index = this.subSlots.length;
      this.subSlots.push(
        this.newSlots({
          arrayIndices: this.arrayIndices.concat([index]),
          initState: {},
        })
      );
      if (initialValue !== undefined) {
        this.context._internal.State.set(`${this.blockId}.${index}`, initialValue);
      }
      this.update = true;
      this.context._internal.update();
    };

    this.removeItem = (index) => {
      this.context._internal.State.removeItem(this.blockId, index);
      const lastSlot = this.subSlots[this.subSlots.length - 1];
      lastSlot.recRemoveBlocksFromMap();
      const largerSlots = this.subSlots.slice(index + 1);
      largerSlots.forEach((slotsClass, i) => {
        slotsClass.recUpdateArrayIndices(
          this.arrayIndices.concat([index + i + 1]),
          this.arrayIndices.concat([index + i])
        );
      });
      this.subSlots.splice(index, 1);

      this.update = true;
      this.context._internal.update();
    };

    this.moveItemUp = (index) => {
      if (index === 0) return;
      this.context._internal.State.swapItems(this.blockId, index - 1, index);
      this.subSlots[index - 1].recUpdateArrayIndices(
        this.arrayIndices.concat([index - 1]),
        this.arrayIndices.concat([index])
      );
      this.subSlots[index].recUpdateArrayIndices(
        this.arrayIndices.concat([index]),
        this.arrayIndices.concat([index - 1])
      );
      swap(this.subSlots, index - 1, index);
      this.update = true;
      this.context._internal.update();
    };

    this.moveItemDown = (index) => {
      if (index === this.subSlots.length - 1) return;
      this.context._internal.State.swapItems(this.blockId, index, index + 1);
      this.subSlots[index + 1].recUpdateArrayIndices(
        this.arrayIndices.concat([index + 1]),
        this.arrayIndices.concat([index])
      );
      this.subSlots[index].recUpdateArrayIndices(
        this.arrayIndices.concat([index]),
        this.arrayIndices.concat([index + 1])
      );
      swap(this.subSlots, index, index + 1);
      this.update = true;
      this.context._internal.update();
    };
  };

  loopSubSlots = (fn) => {
    if (this.subSlots) {
      this.subSlots.forEach(fn);
    }
  };

  isDisplay = () => {
    return this.meta?.category === 'display';
  };
  isList = () => {
    return this.meta?.category === 'list';
  };
  isInput = () => {
    return this.meta?.category === 'input' || this.meta?.category === 'input-container';
  };
  isContainer = () => {
    return this.meta?.category === 'container' || this.meta?.category === 'input-container';
  };

  registerMethod = (methodName, method) => {
    this.methods[methodName] = method;
  };

  newSlots = ({ arrayIndices, initState }) => {
    const slotsClass = new Slots({
      arrayIndices,
      slots: this.slots,
      context: this.context,
    });
    slotsClass.init(initState);

    return slotsClass;
  };

  reset = (parentSubSlots, initWithState) => {
    this.update = true;
    this.showValidation = false;
    if (this.isInput() || this.isList()) {
      let blockValue = get(initWithState, this.blockId);
      if (type.isUndefined(blockValue)) {
        blockValue = type.isUndefined(this.meta.initValue)
          ? type.enforceType(this.meta.valueType, null)
          : this.meta.initValue;

        this.context._internal.State.set(this.blockId, blockValue);
      }
      if (this.isList()) {
        if (!type.isArray(this.subSlots)) {
          this.subSlots = [];
          parentSubSlots[this.id] = this.subSlots;
        }
        if (type.isArray(blockValue)) {
          blockValue.forEach((item, i) => {
            if (!this.subSlots[i]) {
              this.subSlots.push(
                this.newSlots({
                  arrayIndices: this.arrayIndices.concat([i]),
                  initState: initWithState,
                })
              );
            } else {
              this.subSlots[i].reset(initWithState);
            }
          });
          this.subSlots.splice(blockValue.length);
        }
      } else {
        this.value = blockValue;
      }
    }
    if (this.isContainer()) {
      if (!type.isArray(this.subSlots)) {
        this.subSlots = [];
        parentSubSlots[this.id] = this.subSlots;
      }
      if (!this.subSlots[0]) {
        this.subSlots.push(
          this.newSlots({ arrayIndices: this.arrayIndices, initState: initWithState })
        );
      } else {
        this.subSlots[0].reset(initWithState);
      }
    }
  };

  evaluate = (visibleParent, repeat) => {
    if (this.isInput()) {
      const stateValue = get(this.context.state, this.blockId);
      this.value = type.isUndefined(stateValue) ? this.value : stateValue;
    }
    const beforeVisible = this.visibleEval ? this.visibleEval.output : true;
    if (visibleParent === false) {
      this.visibleEval.output = false;
    } else {
      this.visibleEval = this.parse(this.visible);
    }
    if (beforeVisible !== this.visibleEval.output) {
      repeat.value = true;
    }

    if (this.visibleEval.output !== false) {
      this.propertiesEval = this.parse(this.properties);
      this.requiredEval = this.parse(this.required);

      this.validateEval();

      this.classEval = this.parse(this.class);
      this.styleEval = this.parse(this.style);
      this.stylesEval = this.parse(this.styles);
      this.layoutEval = this.parse(this.layout);
      this.loadingEval = this.parse(this.loading);
      this.skeletonEval = this.parse(this.skeleton);
      this.slotsLayoutEval = this.parse(this.slotsLayout);
    }

    if (this.isContainer() || this.isList()) {
      this.loopSubSlots((slotsClass) => {
        repeat.value = slotsClass.recEval(this.visibleEval.output) || repeat.value;
      });
    }
    const after = this.evalToString();
    if (this.before !== after) {
      this.update = true;
      this.before = after;
    }
  };

  parse = (input) => {
    return this.context._internal.parser.parse({
      input,
      location: this.blockId,
      arrayIndices: this.arrayIndices,
    });
  };

  validateEval = () => {
    const requiredValidation = {
      pass: { _not: { _type: 'none' } },
      status: 'error',
      message: type.isString(this.requiredEval.output)
        ? this.requiredEval.output
        : 'This field is required',
    };
    const validation =
      this.requiredEval.output === false ? this.validate : [...this.validate, requiredValidation];

    this.validationEval = {
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
      const parsed = this.parse(test);

      // for parser errors
      if (parsed.errors.length > 0) {
        this.validationEval.output.errors.push(parsed.output.message);
        this.validationEval.errors.push(parsed.errors);
        validationError = true;
        return;
      }
      // failed validation
      if (!parsed.output.pass) {
        // no status indication on validation tests defaults to error
        if (!test.status || test.status === 'error') {
          this.validationEval.output.errors.push(parsed.output.message);
          validationError = true;
        }
        if (test.status === 'warning') {
          this.validationEval.output.warnings.push(parsed.output.message);
          validationWarning = true;
        }
      }
    });
    if (validation.length > 0) {
      this.validationEval.output.status = 'success';
    }
    if (validationWarning) {
      this.validationEval.output.status = 'warning';
    }
    if (validationError && this.showValidation) {
      this.validationEval.output.status = 'error';
    }
  };

  evalToString = () => {
    return serializer.serializeToString({
      slotsLayoutEval: this.slotsLayoutEval,
      classEval: this.classEval,
      layoutEval: this.layoutEval,
      loadingEval: this.loadingEval,
      propertiesEval: this.propertiesEval,
      requiredEval: this.requiredEval,
      skeletonEval: this.skeletonEval,
      styleEval: this.styleEval,
      stylesEval: this.stylesEval,
      validationEval: this.validationEval,
      value: this.value,
      visibleEval: this.visibleEval,
    });
  };

  updateState = (toSet) => {
    if (!this.isVisible()) return;

    if (this.isContainer() || this.isList()) {
      if (this.subSlots && this.subSlots.length > 0) {
        this.loopSubSlots((subSlotsClass) => subSlotsClass.updateState());
        return; // Don't add to set
      } else {
        this.context._internal.State.set(this.blockId, type.enforceType(this.meta.valueType, null));
      }
    }
    if (this.isInput()) {
      this.context._internal.State.set(this.blockId, this.value);
    }
    toSet.add(this.blockId);
  };

  isVisible = () => {
    return this.visibleEval.output !== false;
  };

  updateArrayIndices = () => {
    this.blockId = applyArrayIndices(this.arrayIndices, this.blockIdPattern);
    this.context._internal.RootSlots.map[this.blockId] = this;
  };

  getValidate = (match) => {
    if (!match(this.blockId)) return null;

    this.showValidation = true;
    this.update = true;
    if (
      this.visibleEval.output !== false &&
      this.validationEval.output &&
      this.validationEval.output.errors.length > 0
    ) {
      this.validationEval.output.status = 'error';
      return {
        blockId: this.blockId,
        validation: this.validationEval.output,
      };
    }

    return null;
  };

  deleteFromMap = () => {
    delete this.context._internal.RootSlots.map[this.blockId];
  };

  resetValidation = (match) => {
    if (!match(this.blockId)) return;

    this.showValidation = false;
    this.update = true;
  };

  render = () => {
    if (!this.update) return;

    this.update = false;

    // Collect parse errors from all eval results
    const parseErrors = [
      ...(this.propertiesEval.errors || []),
      ...(this.classEval.errors || []),
      ...(this.styleEval.errors || []),
      ...(this.stylesEval.errors || []),
      ...(this.layoutEval.errors || []),
      ...(this.visibleEval.errors || []),
      ...(this.loadingEval.errors || []),
      ...(this.requiredEval.errors || []),
      ...(this.skeletonEval.errors || []),
      ...(this.slotsLayoutEval.errors || []),
    ];

    this.eval = {
      slots: this.slotsLayoutEval.output,
      class: this.classEval.output,
      configKey: this.configKey,
      events: type.isNone(this.Events.events) ? null : this.Events.events,
      parseErrors: parseErrors.length > 0 ? parseErrors : null,
      properties: this.propertiesEval.output,
      loading: this.loadingEval.output,
      skeleton: this.skeletonEval.output,
      required: this.requiredEval.output,
      layout: this.layoutEval.output,
      style: this.styleEval.output,
      styles: this.stylesEval.output,
      validation: {
        ...(this.validationEval.output || {}),
        status:
          this.showValidation || this.validationEval.output?.status === 'warning'
            ? this.validationEval.output?.status
            : null,
      },
      value: type.isNone(this.value) ? null : this.value,
      visible: this.visibleEval.output,
    };
    this.context._internal.lowdefy._internal.updateBlock(this.id);
  };
}

export default Block;
