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
import Areas from './Areas.js';

class Block {
  constructor(
    { context, arrayIndices },
    {
      id,
      blockId,
      events,
      layout,
      loading,
      properties,
      required,
      skeleton,
      style,
      validate,
      visible,
      type: blockType,
      areas,
    }
  ) {
    this.context = context;
    this.arrayIndices = arrayIndices;

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
    this.style = type.isNone(style) ? {} : style;
    this.validate = type.isNone(validate) ? [] : validate;
    this.visible = type.isNone(visible) ? true : visible;
    this.type = blockType;
    this.areas = areas;

    this.areasLayoutEval = {};
    this.layoutEval = {};
    this.loadingEval = {};
    this.propertiesEval = {};
    this.requiredEval = {};
    this.skeletonEval = {};
    this.styleEval = {};
    this.validationEval = {};
    this.visibleEval = {};

    try {
      this.meta = this.context._internal.lowdefy._internal.blockComponents[this.type].meta;
    } catch (error) {
      throw new Error(
        `Block type ${this.type} not found at ${this.blockId}. Check your plugins to make sure the block is installed. For more info, see https://docs.lowdefy.com/plugins.`
      );
    }
    if (!this.isContainer() && !this.isDisplay() && !this.isInput() && !this.isList()) {
      throw new Error(
        `Block type ${this.type}.meta.category must be either "container", "display", "input" or "list".`
      );
    }

    if (!type.isNone(areas)) {
      this.areasLayout = {};
      Object.keys(areas).forEach((key) => {
        // eslint-disable-next-line no-unused-vars
        const { blocks, ...areaLayout } = areas[key];
        this.areasLayout[key] = { ...areaLayout };
      });
    } else {
      this.areasLayout = {};
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
    // TODO: to initialize new object in array, the new value should be passed by method to unshiftItem and pushItem
    this.unshiftItem = () => {
      this.loopSubAreas((areasClass, i) => {
        areasClass.recUpdateArrayIndices(
          this.arrayIndices.concat([i]),
          this.arrayIndices.concat([i + 1])
        );
      });
      this.subAreas.unshift(
        this.newAreas({ arrayIndices: this.arrayIndices.concat([0]), initState: {} })
      );
      this.context._internal.State.set(this.blockId, undefined);
      // set area block and sub areas values undefined, so as not to pass values to new blocks
      this.subAreas[0].recSetUndefined();
      this.update = true;
      this.context._internal.update();
    };

    this.pushItem = () => {
      this.subAreas.push(
        this.newAreas({
          arrayIndices: this.arrayIndices.concat([this.subAreas.length]),
          initState: {},
        })
      );
      this.update = true;
      this.context._internal.update();
    };

    this.removeItem = (index) => {
      this.context._internal.State.removeItem(this.blockId, index);
      const lastArea = this.subAreas[this.subAreas.length - 1];
      lastArea.recRemoveBlocksFromMap();
      const largerAreas = this.subAreas.slice(index + 1);
      largerAreas.forEach((areasClass, i) => {
        areasClass.recUpdateArrayIndices(
          this.arrayIndices.concat([index + i + 1]),
          this.arrayIndices.concat([index + i])
        );
      });
      this.subAreas.splice(index, 1);

      this.update = true;
      this.context._internal.update();
    };

    this.moveItemUp = (index) => {
      if (index === 0) return;
      this.context._internal.State.swapItems(this.blockId, index - 1, index);
      this.subAreas[index - 1].recUpdateArrayIndices(
        this.arrayIndices.concat([index - 1]),
        this.arrayIndices.concat([index])
      );
      this.subAreas[index].recUpdateArrayIndices(
        this.arrayIndices.concat([index]),
        this.arrayIndices.concat([index - 1])
      );
      swap(this.subAreas, index - 1, index);
      this.update = true;
      this.context._internal.update();
    };

    this.moveItemDown = (index) => {
      if (index === this.subAreas.length - 1) return;
      this.context._internal.State.swapItems(this.blockId, index, index + 1);
      this.subAreas[index + 1].recUpdateArrayIndices(
        this.arrayIndices.concat([index + 1]),
        this.arrayIndices.concat([index])
      );
      this.subAreas[index].recUpdateArrayIndices(
        this.arrayIndices.concat([index]),
        this.arrayIndices.concat([index + 1])
      );
      swap(this.subAreas, index, index + 1);
      this.update = true;
      this.context._internal.update();
    };
  };

  loopSubAreas = (fn) => {
    if (this.subAreas) {
      this.subAreas.forEach(fn);
    }
  };

  isDisplay = () => {
    return this.meta?.category === 'display';
  };
  isList = () => {
    return this.meta?.category === 'list';
  };
  isInput = () => {
    return this.meta?.category === 'input';
  };
  isContainer = () => {
    return this.meta?.category === 'container';
  };

  registerMethod = (methodName, method) => {
    this.methods[methodName] = method;
  };

  newAreas = ({ arrayIndices, initState }) => {
    const areasClass = new Areas({
      arrayIndices,
      areas: this.areas,
      context: this.context,
    });
    areasClass.init(initState);

    return areasClass;
  };

  // TODO: Review
  reset = (parentSubAreas, initWithState) => {
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
        if (!type.isArray(this.subAreas)) {
          this.subAreas = [];
          parentSubAreas[this.id] = this.subAreas;
        }
        if (type.isArray(blockValue)) {
          blockValue.forEach((item, i) => {
            if (!this.subAreas[i]) {
              this.subAreas.push(
                this.newAreas({
                  arrayIndices: this.arrayIndices.concat([i]),
                  initState: initWithState,
                })
              );
            } else {
              this.subAreas[i].reset(initWithState);
            }
          });
          this.subAreas.splice(blockValue.length);
        }
      } else {
        this.value = blockValue;
      }
    } else if (this.isContainer()) {
      if (!type.isArray(this.subAreas)) {
        this.subAreas = [];
        parentSubAreas[this.id] = this.subAreas;
      }
      if (!this.subAreas[0]) {
        this.subAreas.push(
          this.newAreas({ arrayIndices: this.arrayIndices, initState: initWithState })
        );
      } else {
        this.subAreas[0].reset(initWithState);
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
      this.visibleEval = this.context._internal.parser.parse({
        input: this.visible,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      }); // run parser on index combinations to get visible value object
    }
    if (beforeVisible !== this.visibleEval.output) {
      repeat.value = true;
    }

    // TODO: Move into this.eval object
    if (this.visibleEval.output !== false) {
      this.propertiesEval = this.context._internal.parser.parse({
        input: this.properties,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
      this.requiredEval = this.context._internal.parser.parse({
        input: this.required,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });

      this.validateEval();

      this.styleEval = this.context._internal.parser.parse({
        input: this.style,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
      this.layoutEval = this.context._internal.parser.parse({
        input: this.layout,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
      this.loadingEval = this.context._internal.parser.parse({
        input: this.loading,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
      this.skeletonEval = this.context._internal.parser.parse({
        input: this.skeleton,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
      this.areasLayoutEval = this.context._internal.parser.parse({
        input: this.areasLayout,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
    }

    if (this.isContainer() || this.isList()) {
      this.loopSubAreas((areasClass) => {
        repeat.value = areasClass.recEval(this.visibleEval.output) || repeat.value;
      });
    }
    const after = this.evalToString();
    if (this.before !== after) {
      this.update = true;
      this.before = after;
    }
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
      const parsed = this.context._internal.parser.parse({
        input: test,
        location: this.blockId,
        arrayIndices: this.arrayIndices,
      });
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
      areasLayoutEval: this.areasLayoutEval,
      layoutEval: this.layoutEval,
      loadingEval: this.loadingEval,
      propertiesEval: this.propertiesEval,
      requiredEval: this.requiredEval,
      skeletonEval: this.skeletonEval,
      styleEval: this.styleEval,
      validationEval: this.validationEval,
      value: this.value,
      visibleEval: this.visibleEval,
    });
  };

  shouldDelete = () => {
    // block is not visible
    if (this.visibleEval.output === false) return true;

    // block is visible
    if (this.isContainer() || this.isList()) {
      if (this.subAreas && this.subAreas.length > 0) {
        this.loopSubAreas((subAreasClass) => subAreasClass.updateState());
      } else {
        this.context._internal.State.set(this.blockId, type.enforceType(this.meta.valueType, null));
      }
    } else if (this.isInput()) {
      this.context._internal.State.set(this.blockId, this.value);
    }
    return false;
  };

  updateArrayIndices = () => {
    this.blockId = applyArrayIndices(this.arrayIndices, this.blockIdPattern);
    this.context._internal.RootBlocks.map[this.blockId] = this;
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
    delete this.context._internal.RootBlocks.map[this.blockId];
  };

  resetValidation = (match) => {
    if (!match(this.blockId)) return;

    this.showValidation = false;
    this.update = true;
  };

  render = () => {
    if (!this.update) return;

    this.update = false;
    this.eval = {
      areas: this.areasLayoutEval.output,
      events: type.isNone(this.Events.events) ? null : this.Events.events,
      properties: this.propertiesEval.output,
      loading: this.loadingEval.output,
      skeleton: this.skeletonEval.output,
      required: this.requiredEval.output,
      layout: this.layoutEval.output,
      style: this.styleEval.output,
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
