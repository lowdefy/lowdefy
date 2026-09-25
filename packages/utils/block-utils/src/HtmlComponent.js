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

import React from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { type } from '@lowdefy/helpers';

import createHtmlEnhancerGate from './createHtmlEnhancerGate.js';
import getDataEvent from './getDataEvent.js';
import HTML_ENHANCERS from './htmlEnhancers/htmlEnhancers.js';
import NATIVE_INTERACTIVE from './htmlEnhancers/nativeInteractive.js';
import { getHtmlEnhancements } from './registerHtmlEnhancements.js';
import runHtmlEnhancers from './runHtmlEnhancers.js';

const NO_PORTALS = [];

// Only HTML that names one of the enhancers' attributes takes the enhancement
// pass, so markup with test hooks like data-testid (thousands of grid cells)
// stays on the plain path.
const ENHANCER_GATE = createHtmlEnhancerGate(HTML_ENHANCERS);

// Enter and Space click these when they are not native controls.
const ACTIVATES = HTML_ENHANCERS.filter((enhancer) => enhancer.activates)
  .map((enhancer) => enhancer.activates)
  .join(', ');

class HtmlComponent extends React.Component {
  constructor(props) {
    super(props);
    this.div = {
      innerHTML: '',
    };
    this.cleanups = [];
    this.prepared = {};
    this.state = { enhanced: false, overlay: null, portals: NO_PORTALS };
    this.closeOverlay = this.closeOverlay.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onPopoverDataEvent = this.onPopoverDataEvent.bind(this);
    this.onTextSelection = this.onTextSelection.bind(this);
    this.host = this.createHost();
  }

  componentDidMount() {
    this.applyHtml();
  }

  componentDidUpdate() {
    this.applyHtml();
  }

  componentWillUnmount() {
    this.runCleanups();
  }

  // What enhancers' event handlers can see and do.
  createHost() {
    const component = this;
    return {
      closestInRoot: (event, selector) => this.closestInRoot(event, selector),
      contains: (node) => this.div.contains(node),
      closeOverlay: this.closeOverlay,
      openOverlay: (overlay) => this.setState({ overlay }),
      get overlay() {
        return component.state.overlay;
      },
      get prepared() {
        return component.prepared;
      },
      get props() {
        return component.props;
      },
      get registration() {
        return getHtmlEnhancements();
      },
    };
  }

  runCleanups() {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];
  }

  // Parent re-renders usually pass the same string. Re-sanitizing and resetting
  // innerHTML then costs time on every render and resets open <details>, playing
  // media and text selection, so it only happens when the string or element
  // changed.
  applyHtml() {
    const htmlString = type.isNone(this.props.html) ? '' : this.props.html.toString();
    if (this.div === this.appliedDiv && htmlString === this.appliedHtml) {
      return;
    }
    this.runCleanups();
    this.div.innerHTML = DOMPurify.sanitize(htmlString, this.props.sanitizeOptions);
    this.appliedDiv = this.div;
    this.appliedHtml = htmlString;

    const registration = getHtmlEnhancements();
    const enhanced = registration !== null && ENHANCER_GATE.test(htmlString);
    if (!enhanced) {
      this.prepared = {};
      if (this.state.enhanced || this.state.overlay !== null) {
        this.setState({ enhanced: false, overlay: null, portals: NO_PORTALS });
      }
      return;
    }
    const { cleanups, portals, prepared } = runHtmlEnhancers({
      dataEvents: !type.isNone(this.props.onDataEvent),
      enhancers: HTML_ENHANCERS,
      registration,
      root: this.div,
    });
    this.cleanups = cleanups;
    this.prepared = prepared;
    this.setState({ enhanced: true, overlay: null, portals });
  }

  // Only targets inside this element's own DOM count: events from portals
  // (icons, popover content) also bubble here through the React tree.
  closestInRoot(event, selector) {
    const target = event.target.closest?.(selector);
    if (!target || !this.div.contains(target)) return null;
    return target;
  }

  // Calls every enhancer that handles this event, in registry order.
  dispatch(handler, event) {
    HTML_ENHANCERS.forEach((enhancer) => {
      if (enhancer[handler]) {
        enhancer[handler]({ event, host: this.host });
      }
    });
  }

  onTextSelection() {
    if (this.props.events?.onTextSelection) {
      const selection = window.getSelection().toString();
      if (selection !== '') {
        this.props.methods.triggerEvent({
          name: 'onTextSelection',
          event: {
            selection,
          },
        });
      }
    }
  }

  onClick(event) {
    let gated = false;
    if (this.props.onDataEvent) {
      const target = this.closestInRoot(event, '[data-event]');
      if (target) {
        const dataEvent = getDataEvent(target);
        if (dataEvent.name) {
          event.preventDefault();
          gated = this.fireDataEvent({ dataEvent, target });
        }
      }
    }
    // A gate that took over (data-confirm) consumes the click, so no other
    // enhancer replaces its overlay.
    if (this.state.enhanced && !gated) {
      this.dispatch('onClick', event);
    }
    if (this.props.onClick) {
      this.props.onClick(event);
    }
  }

  // An enhancer can take over firing a data-event (data-confirm asks first).
  // Without the enhancement pass there is nothing to ask, as before.
  fireDataEvent({ dataEvent, target }) {
    const fire = () => this.props.onDataEvent(dataEvent);
    if (this.state.enhanced) {
      const gated = HTML_ENHANCERS.some(
        (enhancer) =>
          enhancer.gateDataEvent &&
          enhancer.gateDataEvent({ dataEvent, fire, host: this.host, target })
      );
      if (gated) return true;
    }
    fire();
    return false;
  }

  activationTarget(event) {
    const target = this.closestInRoot(event, ACTIVATES);
    if (!target || target !== event.target || target.matches(NATIVE_INTERACTIVE)) return null;
    return target;
  }

  // Enter and Space activate popover triggers and data-event targets that are
  // not native controls, the way a <button> would: Enter on keydown, Space on
  // keyup, so a released Space never lands on a control that took focus.
  onKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = this.activationTarget(event);
    if (!target) return;
    event.preventDefault();
    if (event.key === 'Enter') {
      target.click();
      return;
    }
    this.spaceTarget = target;
  }

  onKeyUp(event) {
    if (event.key !== ' ') return;
    const target = this.activationTarget(event);
    const pressed = this.spaceTarget;
    this.spaceTarget = null;
    // Like a native button: only a Space pressed and released on the target.
    if (!target || target !== pressed) return;
    event.preventDefault();
    target.click();
  }

  onMouseOver(event) {
    this.dispatch('onMouseOver', event);
  }

  onMouseOut(event) {
    this.dispatch('onMouseOut', event);
  }

  onFocus(event) {
    this.dispatch('onFocus', event);
  }

  onBlur(event) {
    this.dispatch('onBlur', event);
  }

  // reason says why it closed (escape, outside, cancel, confirm), so an overlay
  // can decide where focus goes.
  closeOverlay(reason) {
    const { overlay } = this.state;
    if (overlay === null) return;
    this.setState({ overlay: null });
    if (overlay.onClose) {
      overlay.onClose(reason);
    }
  }

  // A data-event inside a popover is an action: it fires the block event, then
  // the popover closes.
  onPopoverDataEvent(dataEvent) {
    this.props.onDataEvent(dataEvent);
    this.closeOverlay('action');
  }

  renderOverlay() {
    const { HtmlOverlay } = getHtmlEnhancements();
    const { overlay } = this.state;
    let content = overlay.content;
    if (overlay.kind === 'popover') {
      content = (
        <HtmlComponent
          div={true}
          html={overlay.html}
          methods={this.props.methods}
          onDataEvent={this.props.onDataEvent ? this.onPopoverDataEvent : undefined}
          sanitizeOptions={this.props.sanitizeOptions}
        />
      );
    }
    // HtmlOverlay renders nothing in place (antd portals the popup to the
    // body), so the only React children of this element stay portals and an
    // innerHTML reset never removes a React-owned node.
    return (
      <React.Suspense fallback={null}>
        <HtmlOverlay
          content={content}
          kind={overlay.kind}
          onClose={this.closeOverlay}
          onConfirm={overlay.onConfirm}
          target={overlay.target}
        />
      </React.Suspense>
    );
  }

  render() {
    const { className, div, id, onClick, onDataEvent, style } = this.props;
    const { enhanced, overlay, portals } = this.state;
    const Element = div === true ? 'div' : 'span';
    return (
      <Element
        id={id}
        data-testid={id}
        data-lf-html={enhanced ? '' : undefined}
        ref={(el) => {
          if (el) {
            this.div = el;
          }
        }}
        className={className}
        style={style}
        onMouseUp={this.onTextSelection}
        onClick={enhanced || onClick || onDataEvent ? this.onClick : undefined}
        onKeyDown={enhanced ? this.onKeyDown : undefined}
        onKeyUp={enhanced ? this.onKeyUp : undefined}
        onMouseOver={enhanced ? this.onMouseOver : undefined}
        onMouseOut={enhanced ? this.onMouseOut : undefined}
        onFocus={enhanced ? this.onFocus : undefined}
        onBlur={enhanced ? this.onBlur : undefined}
      >
        {portals.map(({ element, key, node }) => createPortal(node, element, key))}
        {overlay && this.renderOverlay()}
      </Element>
    );
  }
}

export default HtmlComponent;
