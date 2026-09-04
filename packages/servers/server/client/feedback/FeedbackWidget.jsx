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

import React, { useCallback, useEffect, useState } from 'react';

import { App as AntdApp, Input, Modal } from 'antd';

import isFeedbackAllowed from './isFeedbackAllowed.js';
import readJourneySessionId from './readJourneySessionId.js';
import sendFeedbackReport from './sendFeedbackReport.js';

// The end user's way to say "this is broken" from inside the running app. It
// is deliberately one text field: the value is not the prose, it is the
// journey session_id sent with it - the report and the recorded steps that led
// to it arrive in the same sink, keyed together.
//
// Cmd/Ctrl+/ is the same shortcut the dev feedback overlay claims, bound at
// capture with stopImmediatePropagation so an app shortcut on the same key
// does not also fire. No tinykeys here: @lowdefy/server does not depend on it.
function FeedbackWidget({ basePath, feedback, pageId, user }) {
  const { message } = AntdApp.useApp();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const allowed = isFeedbackAllowed({ feedback, user });

  useEffect(() => {
    if (!allowed) return undefined;
    function onKeyDown(event) {
      if (event.key !== '/' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen((wasOpen) => !wasOpen);
    }
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [allowed]);

  const submit = useCallback(async () => {
    setSending(true);
    const result = await sendFeedbackReport({
      basePath,
      report: {
        text: text.trim(),
        page_id: pageId,
        session_id: readJourneySessionId(window),
        url: window.location.href,
      },
    });
    setSending(false);
    if (result.ok) {
      setText('');
      setOpen(false);
      message.success('Thank you, your report was sent.');
      return;
    }
    message.error(result.error);
  }, [basePath, message, pageId, text]);

  if (!allowed) return null;

  return (
    <Modal
      confirmLoading={sending}
      okButtonProps={{ disabled: text.trim() === '' }}
      okText="Send"
      onCancel={() => setOpen(false)}
      onOk={submit}
      open={open}
      title="Report a problem"
    >
      <Input.TextArea
        autoFocus
        maxLength={4000}
        onChange={(event) => setText(event.target.value)}
        placeholder="What went wrong, and what were you trying to do?"
        rows={5}
        value={text}
      />
    </Modal>
  );
}

export default FeedbackWidget;
