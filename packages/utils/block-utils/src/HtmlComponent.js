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

import getDataEvent from './getDataEvent.js';
import prepareHtmlEnhancements, { NATIVE_INTERACTIVE } from './prepareHtmlEnhancements.js';
import { getHtmlEnhancements } from './registerHtmlEnhancements.js';

const NO_ICONS = [];

// Only HTML that uses one of these attributes takes the enhancement pass, so
// markup with test hooks like data-testid (thousands of grid cells) stays on
// the plain path.
const ENHANCED_ATTRIBUTES = /data-(icon|tooltip|popover|event)/i;

class HtmlComponent extends React.Component {
  constructor(props) {
    super(props);
    this.div = {
      innerHTML: '',
    };
    this.popoverContents = {};
    this.state = { enhanced: false, icons: NO_ICONS, overlay: null };
    this.closeOverlay = this.closeOverlay.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onPopoverDataEvent = this.onPopoverDataEvent.bind(this);
    this.onTextSelection = this.onTextSelection.bind(this);
    this.openTooltip = this.openTooltip.bind(this);
  }

  componentDidMount() {
    this.applyHtml();
  }

  componentDidUpdate() {
    this.applyHtml();
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
    this.div.innerHTML = DOMPurify.sanitize(htmlString, this.props.sanitizeOptions);
    this.appliedDiv = this.div;
    this.appliedHtml = htmlString;

    const enhancements = getHtmlEnhancements();
    const enhanced = enhancements !== null && ENHANCED_ATTRIBUTES.test(htmlString);
    if (!enhanced) {
      if (this.state.enhanced || this.state.overlay !== null) {
        this.setState({ enhanced: false, icons: NO_ICONS, overlay: null });
      }
      return;
    }
    const { icons, popoverContents } = prepareHtmlEnhancements({
      dataEvents: !type.isNone(this.props.onDataEvent),
      iconMap: enhancements.icons,
      root: this.div,
    });
    this.popoverContents = popoverContents;
    this.setState({ enhanced: true, icons, overlay: null });
  }

  // Only targets inside this element's own DOM count: events from portals
  // (icons, popover content) also bubble here through the React tree.
  closestInRoot(event, selector) {
    const target = event.target.closest?.(selector);
    if (!target || !this.div.contains(target)) return null;
    return target;
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
    if (this.props.onDataEvent) {
      const target = this.closestInRoot(event, '[data-event]');
      if (target) {
        const dataEvent = getDataEvent(target);
        if (dataEvent.name) {
          event.preventDefault();
          this.props.onDataEvent(dataEvent);
        }
      }
    }
    if (this.state.enhanced) {
      this.togglePopover(event);
    }
    if (this.props.onClick) {
      this.props.onClick(event);
    }
  }

  // Enter and Space activate popover triggers and data-event targets that are
  // not native controls, the way a <button> would.
  onKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = this.closestInRoot(event, '[data-popover], [data-event]');
    if (!target || target !== event.target || target.matches(NATIVE_INTERACTIVE)) return;
    event.preventDefault();
    target.click();
  }

  openTooltip(event) {
    const { overlay } = this.state;
    if (overlay?.kind === 'popover') return;
    const target = this.closestInRoot(event, '[data-tooltip]');
    if (!target || overlay?.target === target) return;
    this.setState({
      overlay: { kind: 'tooltip', target, content: target.getAttribute('data-tooltip') },
    });
  }

  closeTooltip(relatedTarget) {
    const { overlay } = this.state;
    if (overlay?.kind !== 'tooltip' || overlay.target.contains(relatedTarget)) return;
    this.setState({ overlay: null });
  }

  onMouseOut(event) {
    this.closeTooltip(event.relatedTarget);
  }

  onBlur(event) {
    this.closeTooltip(event.relatedTarget);
  }

  togglePopover(event) {
    const target = this.closestInRoot(event, '[data-popover]');
    if (!target) return;
    const { overlay } = this.state;
    const wasOpen = overlay?.kind === 'popover' && overlay.target === target;
    this.closeOverlay();
    if (wasOpen) return;
    const id = target.getAttribute('data-popover');
    if (!Object.hasOwn(this.popoverContents, id)) {
      console.warn(`data-popover="${id}" has no element with data-popover-content="${id}".`);
      return;
    }
    target.setAttribute('aria-expanded', 'true');
    this.setState({ overlay: { kind: 'popover', target, html: this.popoverContents[id] } });
  }

  closeOverlay() {
    const { overlay } = this.state;
    if (overlay === null) return;
    if (overlay.kind === 'popover') {
      overlay.target.setAttribute('aria-expanded', 'false');
    }
    this.setState({ overlay: null });
  }

  // A data-event inside a popover is an action: it fires the block event, then
  // the popover closes.
  onPopoverDataEvent(dataEvent) {
    this.props.onDataEvent(dataEvent);
    this.closeOverlay();
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
          target={overlay.target}
        />
      </React.Suspense>
    );
  }

  render() {
    const { className, div, id, onClick, onDataEvent, style } = this.props;
    const { enhanced, icons, overlay } = this.state;
    const Element = div === true ? 'div' : 'span';
    const Icon = enhanced ? getHtmlEnhancements().Icon : null;
    return (
      <Element
        id={id}
        data-testid={id}
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
        onMouseOver={enhanced ? this.openTooltip : undefined}
        onMouseOut={enhanced ? this.onMouseOut : undefined}
        onFocus={enhanced ? this.openTooltip : undefined}
        onBlur={enhanced ? this.onBlur : undefined}
      >
        {icons.map(({ element, name }, index) =>
          createPortal(<Icon properties={{ name, title: '' }} />, element, `${index}:${name}`)
        )}
        {overlay && this.renderOverlay()}
      </Element>
    );
  }
}

export default HtmlComponent;
