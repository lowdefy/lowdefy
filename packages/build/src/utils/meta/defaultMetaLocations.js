/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { version } from '../../../package.json';

const defaultMetaLocations = {
  // @lowdefy/blocks-basic
  Context: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Context.json`,
  },
  Box: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Box.json`,
  },
  DangerousHtml: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/DangerousHtml.json`,
  },
  Html: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Html.json`,
  },
  List: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/List.json`,
  },
  Span: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Span.json`,
  },

  // @lowdefy/blocks-antd
  Affix: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Affix.json`,
  },
  Alert: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Alert.json`,
  },
  Anchor: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Anchor.json`,
  },
  AutoComplete: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/AutoComplete.json`,
  },
  Avatar: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Avatar.json`,
  },
  Badge: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Badge.json`,
  },
  Breadcrumb: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Breadcrumb.json`,
  },
  Button: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Button.json`,
  },
  ButtonSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ButtonSelector.json`,
  },
  Card: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Card.json`,
  },
  CheckboxSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/CheckboxSelector.json`,
  },
  Collapse: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Collapse.json`,
  },
  Comment: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Comment.json`,
  },
  ConfirmModal: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ConfirmModal.json`,
  },
  Content: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Content.json`,
  },
  ControlledList: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ControlledList.json`,
  },
  DateRangeSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/DateRangeSelector.json`,
  },
  DateSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/DateSelector.json`,
  },
  DateTimeSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/DateTimeSelector.json`,
  },
  Descriptions: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Descriptions.json`,
  },
  Divider: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Divider.json`,
  },
  Drawer: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Drawer.json`,
  },
  Footer: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Footer.json`,
  },
  Header: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Header.json`,
  },
  Icon: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Icon.json`,
  },
  Label: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Label.json`,
  },
  Layout: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Layout.json`,
  },
  Menu: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Menu.json`,
  },
  Message: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Message.json`,
  },
  MobileMenu: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/MobileMenu.json`,
  },
  Modal: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Modal.json`,
  },
  MonthSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/MonthSelector.json`,
  },
  MultipleSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/MultipleSelector.json`,
  },
  Notification: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Notification.json`,
  },
  NumberInput: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/NumberInput.json`,
  },
  PageHCF: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHCF.json`,
  },
  PageHCSF: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHCSF.json`,
  },
  PageHeaderMenu: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHeaderMenu.json`,
  },
  PageHSCF: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHSCF.json`,
  },
  PageSHCF: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageSHCF.json`,
  },
  PageSiderMenu: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageSiderMenu.json`,
  },
  Pagination: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Pagination.json`,
  },
  Paragraph: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Paragraph.json`,
  },
  ParagraphInput: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ParagraphInput.json`,
  },
  Progress: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Progress.json`,
  },
  RadioSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/RadioSelector.json`,
  },
  RatingSlider: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/RatingSlider.json`,
  },
  Result: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Result.json`,
  },
  S3UploadButton: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/S3UploadButton.json`,
  },
  Selector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Selector.json`,
  },
  Slider: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Slider.json`,
  },
  Skeleton: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Skeleton.json`,
  },
  Spin: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Spin.json`,
  },
  Statistic: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Statistic.json`,
  },
  Switch: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Switch.json`,
  },
  Tabs: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Tabs.json`,
  },
  TextArea: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TextArea.json`,
  },
  TextInput: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TextInput.json`,
  },
  TimelineList: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TimelineList.json`,
  },
  Title: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Title.json`,
  },
  TitleInput: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TitleInput.json`,
  },
  UserAvatar: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/UserAvatar.json`,
  },
  WeekSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/WeekSelector.json`,
  },

  // @lowdefy/blocks-color-selectors-selectors
  ColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/ColorSelector.json`,
  },
  ChromeColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/ChromeColorSelector.json`,
  },
  CircleColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/CircleColorSelector.json`,
  },
  CompactColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/CompactColorSelector.json`,
  },
  GithubColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/GithubColorSelector.json`,
  },
  SliderColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/SliderColorSelector.json`,
  },
  SwatchesColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/SwatchesColorSelector.json`,
  },
  TwitterColorSelector: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/TwitterColorSelector.json`,
  },
  // @lowdefy/blocks-markdown
  Markdown: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-markdown/meta/Markdown.json`,
  },
  MarkdownWithCode: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-markdown/meta/MarkdownWithCode.json`,
  },
  DangerousMarkdown: {
    url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-markdown/meta/DangerousMarkdown.json`,
  },
};

export default defaultMetaLocations;
