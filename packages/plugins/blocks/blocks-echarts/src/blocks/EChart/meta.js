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

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The EChart element.',
  },
  // The block wires every ECharts mouse, legend, brush and lifecycle event
  // straight through under the ECharts event name.
  events: {
    click: 'Trigger actions when a chart element is clicked.',
    dblclick: 'Trigger actions when a chart element is double clicked.',
    mousedown: 'Trigger actions when the mouse is pressed on a chart element.',
    mousemove: 'Trigger actions when the mouse moves over a chart element.',
    mouseup: 'Trigger actions when the mouse is released on a chart element.',
    mouseover: 'Trigger actions when the mouse enters a chart element.',
    mouseout: 'Trigger actions when the mouse leaves a chart element.',
    globalout: 'Trigger actions when the mouse leaves the chart.',
    contextmenu: 'Trigger actions on a context menu on a chart element.',
    highlight: 'Trigger actions when a chart element is highlighted.',
    downplay: 'Trigger actions when a chart element highlight is removed.',
    selectchanged: 'Trigger actions when the selected chart elements change.',
    legendselectchanged: 'Trigger actions when the legend selection changes.',
    legendselected: 'Trigger actions when a legend item is selected.',
    legendunselected: 'Trigger actions when a legend item is unselected.',
    legendselectall: 'Trigger actions when all legend items are selected.',
    legendinverseselect: 'Trigger actions when the legend selection is inverted.',
    legendscroll: 'Trigger actions when the legend is scrolled.',
    datazoom: 'Trigger actions when the data zoom range changes.',
    datarangeselected: 'Trigger actions when the visual map range is selected.',
    timelinechanged: 'Trigger actions when the timeline point changes.',
    timelineplaychanged: 'Trigger actions when timeline playback is toggled.',
    restore: 'Trigger actions when the chart is restored.',
    dataviewchanged: 'Trigger actions when the data view toolbox changes the data.',
    magictypechanged: 'Trigger actions when the magic type toolbox changes the chart type.',
    geoselectchanged: 'Trigger actions when the geo selection changes.',
    geoselected: 'Trigger actions when a geo region is selected.',
    geounselected: 'Trigger actions when a geo region is unselected.',
    axisareaselected: 'Trigger actions when a parallel axis area is selected.',
    brush: 'Trigger actions when a brush selection is made.',
    brushEnd: 'Trigger actions when a brush selection ends.',
    brushselected: 'Trigger actions when the brush selects chart elements.',
    globalcursortaken: 'Trigger actions when the global cursor is taken.',
    rendered: 'Trigger actions when the chart is rendered.',
    finished: 'Trigger actions when the chart render is finished.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      option: {
        type: 'object',
        description: 'EChart settings object.',
        docs: {
          displayType: 'yaml',
        },
      },
      theme: {
        type: 'object',
        description: 'EChart theme object.',
        docs: {
          displayType: 'yaml',
        },
      },
      width: {
        type: ['number', 'string'],
        default: 'auto',
        description: 'Specify chart width explicitly, in pixel.',
        docs: {
          displayType: 'string',
        },
      },
      height: {
        type: ['number', 'string'],
        default: 'auto',
        description: 'Specify chart height explicitly, in pixel.',
        docs: {
          displayType: 'string',
        },
      },
      init: {
        type: 'object',
        description: 'EChart init object.',
        properties: {
          renderer: {
            type: 'string',
            enum: ['canvas', 'svg'],
            default: 'canvas',
            description: 'Chart renderer.',
          },
          locale: {
            type: 'string',
            enum: ['EN', 'ZH'],
            default: 'EN',
            description: 'Specify the locale.',
          },
        },
      },
    },
  },
};
