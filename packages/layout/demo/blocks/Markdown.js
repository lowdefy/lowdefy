import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';

import './Markdown.css';

const Markdown = ({ blockId, properties }) => (
  <div id={blockId}>
    <ReactMarkdown
      className="markdown-body"
      source={properties.content}
      escapeHtml={!properties.renderHtml}
    />
  </div>
);

export default Markdown;
