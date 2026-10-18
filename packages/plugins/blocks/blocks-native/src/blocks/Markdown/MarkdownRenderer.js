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
import { Pressable, Text, View } from 'react-native';
import { Renderer } from 'react-native-marked';

import getLinkChip from './getLinkChip.js';
import getNodeText from './getNodeText.js';
import LinkChip from './LinkChip.js';
import MarkdownCode from './MarkdownCode.js';
import MarkdownList from './MarkdownList.js';
import MarkdownTable from './MarkdownTable.js';
import restyleText from './restyleText.js';
import { TASK_DONE, TASK_OPEN } from './MarkdownTokenizer.js';
import TaskMark from './TaskMark.js';

const THIN_SPACE = String.fromCharCode(0x2009);

// react-native-marked's renderer, drawn as iOS text: headings marked as headers, lists with a
// marker column and nesting (MarkdownList), task boxes in place of the marker, fenced code in a
// rounded card, quotes with a tint bar, tables in a rounded box and links in the tint. A link
// whose scheme is one of `linkChips` is a chip (LinkChip). Every link is pressed through
// onLinkPress; chips only when onChipPress is given. Raw html is drawn as its source text, as the
// web block escapes it, or dropped with skipHtml.
class MarkdownRenderer extends Renderer {
  constructor({ Icon, linkChips = [], onChipPress, onLinkPress, palette, skipHtml }) {
    super();
    this.Icon = Icon;
    this.linkChips = linkChips;
    this.onChipPress = onChipPress;
    this.onLinkPress = onLinkPress;
    this.palette = palette;
    this.skipHtml = skipHtml;
  }

  heading(text, styles) {
    return (
      <Text
        accessibilityRole="header"
        key={this.getKey()}
        selectable={this.selectable}
        style={styles}
      >
        {text}
      </Text>
    );
  }

  blockquote(children, styles) {
    return (
      <View
        key={this.getKey()}
        style={[
          {
            backgroundColor: this.palette.quoteBackground,
            borderBottomRightRadius: 8,
            borderTopRightRadius: 8,
            flexDirection: 'row',
          },
          styles,
        ]}
        testID="markdown-quote"
      >
        <View style={{ backgroundColor: this.palette.tint, borderRadius: 1.5, width: 3 }} />
        <View
          style={{
            flex: 1,
            marginBottom: -this.palette.blockSpace,
            minWidth: 0,
            paddingBottom: 10,
            paddingHorizontal: 12,
            paddingTop: 10,
          }}
        >
          {children}
        </View>
      </View>
    );
  }

  code(text, language, containerStyle, textStyle) {
    return (
      <MarkdownCode
        key={this.getKey()}
        language={language}
        palette={this.palette}
        style={containerStyle}
        text={text}
        textStyle={textStyle}
      />
    );
  }

  codespan(text, styles) {
    // Thin spaces either side keep the fill off the code's first and last letters.
    return (
      <Text key={this.getKey()} selectable={this.selectable} style={styles}>
        {`${THIN_SPACE}${text}${THIN_SPACE}`}
      </Text>
    );
  }

  hr(styles) {
    return <View key={this.getKey()} style={styles} />;
  }

  list(ordered, li, listStyle, textStyle, startIndex) {
    return (
      <MarkdownList
        items={li}
        key={this.getKey()}
        ordered={ordered}
        palette={this.palette}
        start={startIndex}
        style={listStyle}
      />
    );
  }

  listItem(children) {
    return <View key={this.getKey()}>{children}</View>;
  }

  text(text, styles) {
    if (typeof text !== 'string' || (text[0] !== TASK_OPEN && text[0] !== TASK_DONE)) {
      return super.text(text, styles);
    }
    const mark = <TaskMark checked={text[0] === TASK_DONE} key="task" />;
    if (text.length === 1) {
      return <React.Fragment key={this.getKey()}>{mark}</React.Fragment>;
    }
    return super.text([mark, text.slice(1)], styles);
  }

  link(children, href, styles, title) {
    const chip = getLinkChip({ href, linkChips: this.linkChips, text: getNodeText(children) });
    if (chip !== null) {
      return (
        <LinkChip
          chip={chip.chip}
          href={href}
          Icon={this.Icon}
          key={this.getKey()}
          linkKey={chip.key}
          onPress={this.onChipPress}
          palette={this.palette}
          title={chip.title}
        />
      );
    }
    return (
      <Text
        accessibilityLabel={title}
        accessibilityRole="link"
        key={this.getKey()}
        onPress={() => this.onLinkPress(href)}
        selectable={this.selectable}
        style={styles}
      >
        {children}
      </Text>
    );
  }

  image(uri, alt, style, title) {
    return (
      <View
        key={this.getKey()}
        style={{ borderRadius: 10, marginBottom: this.palette.blockSpace, overflow: 'hidden' }}
      >
        {super.image(uri, alt, style, title)}
      </View>
    );
  }

  linkImage(href, imageUrl, alt, style, title) {
    return (
      <Pressable
        accessibilityRole="link"
        key={this.getKey()}
        onPress={() => this.onLinkPress(href)}
      >
        {this.image(imageUrl, alt, style, title)}
      </Pressable>
    );
  }

  // Each cell's parts flow as one line of text, in the subheadline size; header cells semibold.
  table(header, rows, tableStyle) {
    const cellText = { fontSize: 15, letterSpacing: -0.24, lineHeight: 20 };
    const toCell = (nodes, style) => (
      <Text selectable={this.selectable} style={[this.palette.text, style]}>
        {restyleText(nodes, style)}
      </Text>
    );
    return (
      <MarkdownTable
        header={header.map((cell) => toCell(cell, { ...cellText, fontWeight: '600' }))}
        key={this.getKey()}
        palette={this.palette}
        rows={rows.map((row) => row.map((cell) => toCell(cell, cellText)))}
        style={tableStyle}
      />
    );
  }

  html(text, styles) {
    if (this.skipHtml) {
      return null;
    }
    return super.html(text, styles);
  }
}

export default MarkdownRenderer;
