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

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { theme } from 'antd';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import answerScores from './answerScores.js';
import nextIntentState from './nextIntentState.js';
import css from './IntentInput.module.css';

const IDLE = { intent: null, challenger: undefined, mode: 'idle', choices: [] };
const CLASSIFY_DELAY = 150;
const SETTLE_DELAY = 450;

// A text input that becomes what the user means. The app classifies the text on
// onClassify (typically a Decide request) and passes the answer back; each intent
// has a slot of the same name. The block only decides which slot to show and how
// sure to look, and animates between them.
function IntentInput({
  blockId,
  classNames = {},
  components: { Icon },
  content,
  methods,
  properties,
  styles = {},
  value,
}) {
  const { token } = theme.useToken();
  const intents = properties.intents ?? {};
  const confidence = {
    preview: properties.confidence?.preview ?? 0.3,
    show: properties.confidence?.show ?? 0.6,
    switch: properties.confidence?.switch ?? 0.85,
  };
  const text = value?.text ?? '';

  // Keep the last answer while the next one loads, so the slot does not drop out
  // between keystrokes.
  const heldAnswer = useRef(null);
  if (!type.isNone(properties.answer)) heldAnswer.current = properties.answer;
  const scores = answerScores({ answer: heldAnswer.current, intents });

  const [state, setState] = useState(IDLE);
  const [pinned, setPinned] = useState(null);

  // A round runs each time the latest classification finishes, not when the scores
  // change: an answer that repeats the last one (the same text typed again after a
  // clear) still counts, and a classification a newer one replaced does not.
  const [round, setRound] = useState(0);
  const latestClassify = useRef(0);

  useEffect(() => {
    latestClassify.current += 1;
    if (!text) {
      setState(IDLE);
      setPinned(null);
      return undefined;
    }
    const classify = latestClassify.current;
    const timer = setTimeout(async () => {
      const result = await methods.triggerEvent({ name: 'onClassify', event: { text } });
      if (classify === latestClassify.current && result.success) setRound((n) => n + 1);
    }, CLASSIFY_DELAY);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (!text) return;
    setState((current) => nextIntentState({ state: current, scores, confidence }));
  }, [round]);

  // Typing restarts the pause, so a challenger only wins on a pause while the user
  // is not typing.
  useEffect(() => {
    if (state.challenger === undefined) return undefined;
    const timer = setTimeout(
      () => setState((current) => nextIntentState({ state: current, scores, confidence })),
      SETTLE_DELAY
    );
    return () => clearTimeout(timer);
  }, [state.challenger, round, text]);

  // A picked choice holds until the scores commit to a different intent on their own.
  useEffect(() => {
    if (pinned && state.mode === 'committed' && state.intent !== pinned) setPinned(null);
  }, [state]);

  const intent = pinned ?? state.intent;
  const mode = pinned ? 'committed' : state.mode;

  // onIntentChange fires when the shown intent or mode changes, not on mount.
  const shown = useRef({ intent: null, mode: 'idle' });
  useEffect(() => {
    if (value?.intent !== intent || value?.mode !== mode) methods.setValue({ text, intent, mode });
    if (shown.current.intent === intent && shown.current.mode === mode) return;
    shown.current = { intent, mode };
    methods.triggerEvent({ name: 'onIntentChange', event: { intent, mode } });
  }, [intent, mode]);

  const innerRef = useRef(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setHeight(entry.target.offsetHeight));
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, []);

  const accentOf = (key) => intents[key]?.color ?? token.colorPrimary;
  const labelOf = (key) => intents[key]?.label ?? key;

  return (
    <div
      id={blockId}
      data-mode={mode}
      className={`${css.root} ${classNames.element ?? ''}`}
      style={{
        '--accent': intent ? accentOf(intent) : token.colorPrimary,
        '--border': token.colorBorderSecondary,
        '--bg': token.colorBgContainer,
        '--text': token.colorText,
        '--muted': token.colorTextTertiary,
        fontFamily: token.fontFamily,
        ...styles.element,
      }}
    >
      <div className={css.field}>
        <input
          id={`${blockId}_input`}
          className={css.input}
          autoFocus={properties.autoFocus}
          autoComplete="off"
          placeholder={properties.placeholder}
          value={text}
          onChange={(event) => {
            methods.setValue({ text: event.target.value, intent, mode });
            methods.triggerEvent({ name: 'onChange', event: { text: event.target.value } });
          }}
          onKeyDown={(event) => {
            // Enter while an IME is composing picks a candidate; it must not submit.
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            methods.triggerEvent({ name: 'onSubmit', event: { text, intent, mode } });
          }}
        />
        {intent && (
          <span key={intent} className={css.badge}>
            {intents[intent]?.icon && (
              <Icon blockId={`${blockId}_badge_icon`} properties={intents[intent].icon} />
            )}
            {labelOf(intent)}
            {mode !== 'committed' && '?'}
          </span>
        )}
      </div>
      <div className={css.morph} style={{ height }}>
        <div ref={innerRef} className={css.inner}>
          {mode === 'choose' && (
            <div className={css.choices}>
              <span className={css.choicesLabel}>Did you mean</span>
              {state.choices.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={css.choice}
                  style={{ '--accent': accentOf(key) }}
                  onClick={() => setPinned(key)}
                >
                  {intents[key]?.icon && (
                    <Icon
                      blockId={`${blockId}_choice_${key}_icon`}
                      properties={intents[key].icon}
                    />
                  )}
                  {labelOf(key)}
                </button>
              ))}
            </div>
          )}
          {intent && content[intent] && (
            <div key={intent} className={css.slot} data-preview={mode !== 'committed'}>
              {content[intent]()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withBlockDefaults(IntentInput);
