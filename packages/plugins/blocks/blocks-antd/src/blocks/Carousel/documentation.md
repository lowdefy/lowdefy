<TITLE>
Carousel
</TITLE>

<DESCRIPTION>

Carousel to navigate through different slides consisting of blocks.
The key of each slide is the area keys of the container.

### Methods

  - `goTo`: Set the current slide to a specific slide.
    - `slide: string`: The key of the chosen slide.
    - `dontAnimate: boolean`: If true, the transition happens without animation.
  - `next`: Set the next slide as the current slide.
  - `prev`: Set the previous slide as the current slide.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "accessibility": {
        "type": "boolean",
        "default": true,
        "description": "Enable tabbing and arrow key navigation."
      },
      "adaptiveHeight": {
        "type": "boolean",
        "default": false,
        "description": "Adjust the slide's height automatically."
      },
      "arrows": {
        "type": "boolean",
        "default": false,
        "description": "Whether or not to show arrows."
      },
      "autoplaySpeed": {
        "type": "integer",
        "default": 3000,
        "description": "Delay between each auto scroll (in milliseconds)."
      },
      "autoplay": {
        "type": "boolean",
        "default": false,
        "description": "Toggles whether or not to scroll automatically."
      },
      "centerMode": {
        "type": "boolean",
        "default": false,
        "description": "Center current slide."
      },
      "centerPadding": {
        "type": "string",
        "default": "50px",
        "description": "Padding applied to center slide."
      },
      "dotPosition": {
        "type": "string",
        "enum": ["left", "right", "top", "bottom"],
        "default": "bottom",
        "description": "The position of the dots, which can be one of top, bottom, left or right."
      },
      "dots": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not to show the dots."
      },
      "draggable": {
        "type": "boolean",
        "default": false,
        "description": "Enable scrollable via dragging on desktop"
      },
      "easing": {
        "type": "string",
        "default": "linear",
        "description": "Transition interpolation function name."
      },
      "effect": {
        "type": "string",
        "default": "scrollx",
        "description": "Transition effect, either scrollx or fade."
      },
      "focusOnSelect": {
        "type": "boolean",
        "default": false,
        "description": "Go to slide on click."
      },
      "infinite": {
        "type": "boolean",
        "default": true,
        "description": "Infinitely wrap around contents."
      },
      "pauseOnDotsHover": {
        "type": "boolean",
        "default": false,
        "description": "Prevents autoplay while hovering on dot."
      },
      "pauseOnFocus": {
        "type": "boolean",
        "default": false,
        "description": "Prevents autoplay while focused on slides."
      },
      "pauseOnHover": {
        "type": "boolean",
        "default": true,
        "description": "Prevents autoplay while hovering on track."
      },
      "responsive": {
        "type": "array",
        "default": [],
        "description": "Customize based on breakpoints.",
        "items": {
          "type": "object",
          "properties": {
            "breakpoint": {
              "type": "integer",
              "description": "Maximum screen size."
            },
            "settings": {
              "type": "object",
              "description": "Carousel properties.",
              "docs": {
                "displayType": "yaml"
              }
            }
          }
        }
      },
      "rows": {
        "type": "integer",
        "default": 1,
        "description": "Number of rows per slide in the slider, (enables grid mode)."
      },
      "rtl": {
        "type": "boolean",
        "default": false,
        "description": "Reverses the slide order."
      },
      "slidesPerRow": {
        "type": "integer",
        "default": 1,
        "description": "Number of slides to display in grid mode, this is useful with rows option."
      },
      "slidesToScroll": {
        "type": "integer",
        "default": 1,
        "description": "How many slides to scroll at once."
      },
      "slidesToShow": {
        "type": "integer",
        "default": 1,
        "description": "How many slides to show in one frame."
      },
      "speed": {
        "type": "integer",
        "default": 500,
        "description": "Number of slides to display in grid mode, this is useful with rows option."
      },
      "swipeToSlide": {
        "type": "boolean",
        "default": false,
        "description": "Enable drag/swipe irrespective of `slidesToScroll`."
      },
      "swipe": {
        "type": "boolean",
        "default": true,
        "description": "Enable/disable swiping to change slides."
      },
      "vertical": {
        "type": "boolean",
        "default": false,
        "description": "Whether or not the slides are shown in a column."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "afterChange": {
        "type": "array",
        "description": "Trigger actions after the slide is changed."
      },
      "beforeChange": {
        "type": "array",
        "description": "Trigger actions before the slide is changed."
      },
      "onInit": {
        "type": "array",
        "description": "Trigger actions when the carousel is initialized."
      },
      "onSwipe": {
        "type": "array",
        "description": "Trigger actions when the carousel is swiped."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Carousel

```yaml
id: basic_carousel
type: Carousel
properties:
  draggable: true
  slides:
    - key: slide_one
    - key: slide_two
    - key: slide_three
  slidesToShow: 1
areas:
  slide_one:
    blocks:
      - id: side_1
        type: Card
        blocks:
          - id: title_side_1
            type: Title
            properties:
              content: Slide 1
  slide_two:
    blocks:
      - id: side_2
        type: Card
        blocks:
          - id: title_side_2
            type: Title
            properties:
              content: Slide 2
  slide_three:
    blocks:
      - id: side_3
        type: Card
        blocks:
          - id: title_side_3
            type: Title
            properties:
              content: Slide 3
```

### Responsive Carousel

```yaml
id: responsive_carousel
type: Carousel
properties:
  autoplay: true
  draggable: true
  slidesToShow: 3
  slides:
    - key: slide_one
    - key: slide_two
    - key: slide_three
    - key: slide_four
  responsive:
    - breakpoint: 1024
      settings:
        slidesToScroll: 2
        slidesToShow: 2
        dots: true
        infinite: true
    - breakpoint: 600
      settings:
        slidesToScroll: 1
        slidesToShow: 1
areas:
  slide_one:
    blocks:
      - id: side_1
        type: Card
        blocks:
          - id: title_side_1
            type: Title
            properties:
              content: Slide 1
  slide_two:
    blocks:
      - id: side_2
        type: Card
        blocks:
          - id: title_side_2
            type: Title
            properties:
              content: Slide 2
  slide_three:
    blocks:
      - id: side_3
        type: Card
        blocks:
          - id: title_side_3
            type: Title
            properties:
              content: Slide 3
  slide_four:
    blocks:
      - id: side_4
        type: Card
        blocks:
          - id: title_side_4
            type: Title
            properties:
              content: Slide 4
```

</EXAMPLES>
