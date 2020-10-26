/*
  Copyright 2020 Lowdefy, Inc

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

const defaultMetaLocations = {
  // @lowdefy/blocks-basic
  Context: {
    url: 'https://unpkg.com/@lowdefy/blocks-basic@^1.0.0/dist/meta/Context.json',
  },
  Box: {
    url: 'https://unpkg.com/@lowdefy/blocks-basic@^1.0.0/dist/meta/Box.json',
  },
  Html: {
    url: 'https://unpkg.com/@lowdefy/blocks-basic@^1.0.0/dist/meta/Html.json',
  },
  List: {
    url: 'https://unpkg.com/@lowdefy/blocks-basic@^1.0.0/dist/meta/List.json',
  },
  Span: {
    url: 'https://unpkg.com/@lowdefy/blocks-basic@^1.0.0/dist/meta/Span.json',
  },

  // @lowdefy/blocks-antd
  Affix: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Affix.json',
  },
  Alert: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Alert.json',
  },
  Anchor: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Anchor.json',
  },
  AutoComplete: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/AutoComplete.json',
  },
  Avatar: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Avatar.json',
  },
  Badge: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Badge.json',
  },
  Breadcrumb: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Breadcrumb.json',
  },
  Button: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Button.json',
  },
  ButtonSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/ButtonSelector.json',
  },
  Card: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Card.json',
  },
  CheckboxSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/CheckboxSelector.json',
  },
  Collapse: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Collapse.json',
  },
  Comment: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Comment.json',
  },
  ConfirmModal: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/ConfirmModal.json',
  },
  Content: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Content.json',
  },
  ControlledList: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/ControlledList.json',
  },
  DateRangeSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/DateRangeSelector.json',
  },
  DateSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/DateSelector.json',
  },
  DateTimeSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/DateTimeSelector.json',
  },
  Descriptions: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Descriptions.json',
  },
  Divider: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Divider.json',
  },
  Drawer: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Drawer.json',
  },
  Footer: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Footer.json',
  },
  Header: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Header.json',
  },
  Label: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Label.json',
  },
  Layout: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Layout.json',
  },
  Menu: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Menu.json',
  },
  Message: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Message.json',
  },
  MobileMenu: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/MobileMenu.json',
  },
  Modal: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Modal.json',
  },
  MonthSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/MonthSelector.json',
  },
  MultipleSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/MultipleSelector.json',
  },
  Notification: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Notification.json',
  },
  NumberInput: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/NumberInput.json',
  },
  PageHCF: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/PageHCF.json',
  },
  PageHCSF: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/PageHCSF.json',
  },
  PageHeaderMenu: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/PageHeaderMenu.json',
  },
  PageHSCF: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/PageHSCF.json',
  },
  PageSHCF: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/PageSHCF.json',
  },
  PageSiderMenu: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/PageSiderMenu.json',
  },
  Pagination: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Pagination.json',
  },
  Paragraph: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Paragraph.json',
  },
  Progress: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Progress.json',
  },
  RadioSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/RadioSelector.json',
  },
  RatingSlider: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/RatingSlider.json',
  },
  Result: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Result.json',
  },
  S3UploadButton: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/S3UploadButton.json',
  },
  Selector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Selector.json',
  },
  Slider: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Slider.json',
  },
  Skeleton: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Skeleton.json',
  },
  Spin: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Spin.json',
  },
  Statistic: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Statistic.json',
  },
  Switch: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Switch.json',
  },
  Tabs: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Tabs.json',
  },
  TextArea: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/TextArea.json',
  },
  TextInput: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/TextInput.json',
  },
  Timeline: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Timeline.json',
  },
  Title: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/Title.json',
  },
  UserAvatar: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/UserAvatar.json',
  },
  WeekSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/meta/WeekSelector.json',
  },

  // @lowdefy/blocks-amcharts
  AmCharts4Pie: {
    url: 'https://unpkg.com/@lowdefy/blocks-amcharts@^1.0.0/dist/meta/AmCharts4Pie.json',
  },
  AmCharts4XY: {
    url: 'https://unpkg.com/@lowdefy/blocks-amcharts@^1.0.0/dist/meta/AmCharts4XY.json',
  },
  // @lowdefy/blocks-code-editors
  CodeEditor: {
    url: 'https://unpkg.com/@lowdefy/blocks-code-editors@^1.0.0/dist/meta/CodeEditor.json',
  },
  // @lowdefy/blocks-color-selectors
  ColorSelector: {
    url: 'https://unpkg.com/@lowdefy/blocks-color-selectors@^1.0.0/dist/meta/ColorSelector.json',
  },
  // @lowdefy/blocks-antd-icons
  Icon: {
    url: 'https://unpkg.com/@lowdefy/blocks-antd-icons@^1.0.0/dist/meta/Icon.json',
  },
  // @lowdefy/blocks-markdown
  Markdown: {
    url: 'https://unpkg.com/@lowdefy/blocks-markdown@^1.0.0/dist/meta/Markdown.json',
  },
};

export default defaultMetaLocations;
