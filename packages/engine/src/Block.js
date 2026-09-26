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

import { ConfigError } from '@lowdefy/errors';
import { applyArrayIndices, get, serializer, swap, type } from '@lowdefy/helpers';
import Events from './Events.js';
import Slots from './Slots.js';
import inputContainsOperator from './tracking/inputContainsOperator.js';
import readsIntersectChanges from './tracking/readsIntersectChanges.js';

const noReads = new Set();

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
    // Kept with blockId so every evaluation records the same string, not a new one to hash.
    this.ownStateReadKey = `state:${this.blockId}`;

    this.events = type.isNone(events) ? {} : events;
    this.layout = type.isNone(layout) ? {} : layout;
    this.loading = type.isNone(loading) ? false : loading;
    this.properties = type.isNone(properties) ? {} : properties;
    this.required = type.isNone(required) ? false : required;
    this.skeleton = type.isNone(skeleton) ? null : skeleton;
    this.class = type.isNone(blockClass) ? {} : blockClass;
    this.style = type.isNone(style) ? {} : style;
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
    this.validationEval = {};
    this.visibleEval = {};

    // Dependency tracking. reads holds the keys the last self-evaluation read. alwaysEvaluate names
    // why the block must evaluate on every pass (volatile or untracked operators, no recording), or
    // is null when its reads say when it is dirty. forceEvaluate marks engine-side changes no key
    // describes: a row index move or a validation display change.
    this.reads = noReads;
    this.alwaysEvaluate = 'not evaluated';
    this.forceEvaluate = false;
    this.requiredValidation = null;

    this.meta = this.context._internal.lowdefy._internal.blockMetas[this.type];
    if (!this.meta) {
      throw new ConfigError(
        `Block type ${this.type} not found at ${this.blockId}. Check your plugins to make sure the block is installed. For more info, see https://docs.lowdefy.com/plugins.`,
        { configKey: blockConfig['~k'] }
      );
    }
    if (!this.isContainer() && !this.isDisplay() && !this.isInput() && !this.isList()) {
      throw new ConfigError(
        `Block type ${this.type}.meta.category must be either "container", "display", "input", "list", or "input-container".`,
        { configKey: blockConfig['~k'] }
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
      this.context._internal.update({ changes: [`state:${this.blockId}`] });
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
      this.context._internal.update({ changes: [`state:${this.blockId}`] });
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
      this.context._internal.update({ changes: [`state:${this.blockId}`] });
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
      this.context._internal.update({ changes: [`state:${this.blockId}`] });
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
      this.context._internal.update({ changes: [`state:${this.blockId}`] });
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
      this.context._internal.update({ changes: [`state:${this.blockId}`] });
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

  // A validation display change alters the block's validation output without any reported change.
  setShowValidation = (showValidation) => {
    if (this.showValidation !== showValidation) {
      this.forceEvaluate = true;
    }
    this.showValidation = showValidation;
  };

  reset = (parentSubSlots, initWithState) => {
    this.update = true;
    this.setShowValidation(false);
    if (this.isInput() || this.isList()) {
      let blockValue = get(initWithState, this.blockId);
      if (type.isUndefined(blockValue)) {
        // If the block was hidden in the previous eval cycle, Slots.updateState
        // deleted its state field. Without this guard, every SetState would
        // wipe the in-memory value back to the enforceType default. The next
        // updateState republishes this.value (inputs) or sub-block state
        // (lists) when the block becomes visible, or leaves the field deleted
        // if it stays hidden. This makes SetState-driven visibility toggles
        // consistent with setValue-driven toggles.
        const wasInvisible = this.visibleEval && this.visibleEval.output === false;
        const inputHasValue = this.isInput() && !type.isUndefined(this.value);
        const listHasSubSlots =
          this.isList() && type.isArray(this.subSlots) && this.subSlots.length > 0;
        if (wasInvisible && (inputHasValue || listHasSubSlots)) {
          // For inputs, reuse this.value below.
          // For lists, leave blockValue undefined so the rebuild loop skips
          // (preserving subSlots). Sub-block this.value stays in memory and
          // is republished by updateState once the list becomes visible.
          if (inputHasValue) {
            blockValue = this.value;
          }
        } else {
          blockValue = type.isUndefined(this.meta.initValue)
            ? type.enforceType(this.meta.valueType, null)
            : this.meta.initValue;

          this.context._internal.State.republish(this.blockId, blockValue);
        }
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
              this.subSlots[i].resetBlocks(initWithState);
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
        this.subSlots[0].resetBlocks(initWithState);
      }
    }
  };

  // A full evaluation: the block, then its whole subtree.
  evaluate = (visibleParent, repeat) => {
    this.syncValue();
    this.evaluateSelf(visibleParent, repeat);
    if (this.isContainer() || this.isList()) {
      this.loopSubSlots((slotsClass) => {
        repeat.value = slotsClass.recEval(this.visibleEval.output) || repeat.value;
      });
    }
  };

  // A dependency-tracked evaluation: the block evaluates itself only when it is dirty, then its
  // subtree does the same. A block whose visibility changed evaluates its whole subtree, since every
  // descendant reads its parent's visibility.
  evaluateTracked = ({ visibleParent, subtreeDirty, changes, repeat }) => {
    this.syncValue();
    let childrenDirty = subtreeDirty;
    if (subtreeDirty || this.isDirty(changes)) {
      const visibilityChanged = this.evaluateSelf(visibleParent, repeat);
      childrenDirty = subtreeDirty || visibilityChanged;
    }
    if (this.isContainer() || this.isList()) {
      this.loopSubSlots((slotsClass) => {
        repeat.value =
          slotsClass.recEvalTracked({
            visibleParent: this.visibleEval.output,
            subtreeDirty: childrenDirty,
            changes,
          }) || repeat.value;
      });
    }
  };

  isDirty = (changes) => {
    return (
      this.forceEvaluate ||
      this.alwaysEvaluate !== null ||
      readsIntersectChanges({ reads: this.reads, changes })
    );
  };

  // Every pass points an input's value at its state value, dirty or not, so the value keeps the
  // identity state holds (reset leaves a copy behind).
  syncValue = () => {
    if (!this.isInput()) return;
    const stateValue = get(this.context.state, this.blockId);
    this.value = type.isUndefined(stateValue) ? this.value : stateValue;
  };

  // Evaluates the block's own roots and validation, recording what they read. Returns whether the
  // block's visibility changed.
  evaluateSelf = (visibleParent, repeat) => {
    const tracker = this.context._internal.DependencyTracker;
    const beforeVisible = this.visibleEval ? this.visibleEval.output : true;
    const recorder = tracker.startRecording();
    try {
      this.evaluateRoots(visibleParent);
    } finally {
      tracker.stopRecording(recorder);
    }
    this.storeReads(recorder);
    this.forceEvaluate = false;

    const visibilityChanged = beforeVisible !== this.visibleEval.output;
    if (visibilityChanged) {
      repeat.value = true;
    }
    const after = this.evalToString();
    if (this.before !== after) {
      this.update = true;
      this.before = after;
    }
    return visibilityChanged;
  };

  evaluateRoots = (visibleParent) => {
    if (this.isInput()) {
      this.recordEngineRead(this.ownStateReadKey);
    }
    if (visibleParent === false) {
      this.visibleEval.output = false;
    } else {
      this.visibleEval = this.parse(this.visible);
    }

    if (this.isList() && !this.isVisible()) {
      this.recordEngineRead(this.ownStateReadKey);
      this.captureHiddenValue();
    }

    if (this.visibleEval.output !== false) {
      this.propertiesEval = this.parse(this.properties);
      this.requiredEval = this.parse(this.required);

      this.validateEval();

      this.classEval = this.parse(this.class);
      this.styleEval = this.parse(this.style);
      this.layoutEval = this.parse(this.layout);
      this.loadingEval = this.parse(this.loading);
      this.skeletonEval = this.parse(this.skeleton);
      this.slotsLayoutEval = this.parse(this.slotsLayout);
    }
  };

  recordEngineRead = (key) => {
    this.context._internal.readRecorder?.engineRead(key);
  };

  // A recording parser signals every operator call it makes, a pure one included. A block that
  // parsed operators while the parser signalled nothing at all cannot be told apart from a parser
  // that does not record, so it is treated as untracked.
  storeReads = (recorder) => {
    if (recorder === null) {
      this.reads = noReads;
      this.alwaysEvaluate = 'not recorded';
      return;
    }
    this.reads = recorder.reads;
    if (recorder.untrackedReasons.length > 0) {
      this.alwaysEvaluate = `untracked: ${recorder.untrackedReasons[0]}`;
    } else if (recorder.volatileReasons.length > 0) {
      this.alwaysEvaluate = `volatile: ${recorder.volatileReasons[0]}`;
    } else if (recorder.parsedOperators && recorder.parserCalls === 0) {
      this.alwaysEvaluate = 'operators reported no reads';
    } else {
      this.alwaysEvaluate = null;
    }
  };

  parse = (input) => {
    const recorder = this.context._internal.readRecorder;
    if (recorder !== null && !recorder.parsedOperators && inputContainsOperator(input)) {
      recorder.parsedOperators = true;
    }
    return this.context._internal.parser.parse({
      input,
      location: this.blockId,
      arrayIndices: this.arrayIndices,
    });
  };

  // Kept per block while its message is unchanged, so the parser's compiled-tree cache (keyed on
  // the input object) can hit.
  getRequiredValidation = () => {
    let message;
    if (type.isString(this.requiredEval.output)) {
      message = this.requiredEval.output;
    } else {
      this.recordEngineRead('i18n');
      message = this.context._internal.lowdefy._internal.translate(
        'engine.validation.fieldRequired'
      );
    }
    if (this.requiredValidation?.message !== message) {
      this.requiredValidation = {
        pass: { _not: { _type: 'none' } },
        status: 'error',
        message,
      };
    }
    return this.requiredValidation;
  };

  validateEval = () => {
    const validation =
      this.requiredEval.output === false
        ? this.validate
        : [...this.validate, this.getRequiredValidation()];

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
      validationEval: this.validationEval,
      value: this.value,
      visibleEval: this.visibleEval,
    });
  };

  captureHiddenValue = () => {
    const stateValue = get(this.context.state, this.blockId);
    if (type.isUndefined(stateValue)) return;
    this.hiddenValue = serializer.copy(stateValue);
  };

  restoreHiddenValue = () => {
    if (type.isUndefined(this.hiddenValue)) return;
    if (type.isUndefined(get(this.context.state, this.blockId))) {
      this.context._internal.State.republish(this.blockId, this.hiddenValue);
    }
    this.hiddenValue = undefined;
  };

  updateState = (toSet) => {
    if (!this.isVisible()) return;

    if (this.isList()) {
      this.restoreHiddenValue();
    }

    if (this.isContainer() || this.isList()) {
      if (this.subSlots && this.subSlots.length > 0) {
        this.loopSubSlots((subSlotsClass) => subSlotsClass.updateState());
        return; // Don't add to set
      } else {
        this.context._internal.State.republish(
          this.blockId,
          type.enforceType(this.meta.valueType, null)
        );
      }
    }
    if (this.isInput()) {
      this.context._internal.State.republish(this.blockId, this.value);
    }
    toSet.add(this.blockId);
  };

  isVisible = () => {
    return this.visibleEval.output !== false;
  };

  // A row move changes the paths this block's operators resolve ('$' paths, the location _type and
  // _regex default to), so its recorded reads name the wrong row until it evaluates again.
  updateArrayIndices = () => {
    this.forceEvaluate = true;
    this.blockId = applyArrayIndices(this.arrayIndices, this.blockIdPattern);
    this.ownStateReadKey = `state:${this.blockId}`;
    this.context._internal.RootSlots.map[this.blockId] = this;
  };

  getValidate = (match) => {
    if (!match(this.blockId)) return null;

    this.setShowValidation(true);
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

    this.setShowValidation(false);
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
    // Updaters register per context — a context under construction has none,
    // so construction-time evals never setState mounted components from a
    // previous context.
    this.context._internal.updaters[this.id]?.();
  };
}

export default Block;
