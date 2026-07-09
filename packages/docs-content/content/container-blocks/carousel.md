# Carousel

Carousel slider with autoplay, dots, and transition effects.

Slide 1

Slide 2

Slide 3

Slide 4

```yaml
- id: basic_carousel
  type: Carousel
  slots:
    basic_s1:
      blocks:
        - id: basic_s1
          type: Box
          style:
            height: 160
            background: "#364d79"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: basic_s1_text
              type: Title
              properties:
                content: Slide 1
                level: 3
              style:
                color: white
    basic_s2:
      blocks:
        - id: basic_s2
          type: Box
          style:
            height: 160
            background: "#263c5a"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: basic_s2_text
              type: Title
              properties:
                content: Slide 2
                level: 3
              style:
                color: white
    basic_s3:
      blocks:
        - id: basic_s3
          type: Box
          style:
            height: 160
            background: "#1a2d45"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: basic_s3_text
              type: Title
              properties:
                content: Slide 3
                level: 3
              style:
                color: white
    basic_s4:
      blocks:
        - id: basic_s4
          type: Box
          style:
            height: 160
            background: "#0d1e30"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: basic_s4_text
              type: Title
              properties:
                content: Slide 4
                level: 3
              style:
                color: white
```

Blue

Green

Purple

Volcano

Magenta

```yaml
- id: color_carousel
  type: Carousel
  slots:
    color_s1:
      blocks:
        - id: color_s1
          type: Box
          style:
            height: 180
            background: "#1677ff"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: color_s1_text
              type: Title
              properties:
                content: Blue
                level: 3
              style:
                color: white
    color_s2:
      blocks:
        - id: color_s2
          type: Box
          style:
            height: 180
            background: "#52c41a"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: color_s2_text
              type: Title
              properties:
                content: Green
                level: 3
              style:
                color: white
    color_s3:
      blocks:
        - id: color_s3
          type: Box
          style:
            height: 180
            background: "#722ed1"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: color_s3_text
              type: Title
              properties:
                content: Purple
                level: 3
              style:
                color: white
    color_s4:
      blocks:
        - id: color_s4
          type: Box
          style:
            height: 180
            background: "#fa541c"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: color_s4_text
              type: Title
              properties:
                content: Volcano
                level: 3
              style:
                color: white
    color_s5:
      blocks:
        - id: color_s5
          type: Box
          style:
            height: 180
            background: "#eb2f96"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: color_s5_text
              type: Title
              properties:
                content: Magenta
                level: 3
              style:
                color: white
```

Auto Slide 1

Auto Slide 2

Auto Slide 3

Auto Slide 4

```yaml
- id: auto_carousel
  type: Carousel
  properties:
    autoplay: true
    autoplaySpeed: 2000
  slots:
    auto_s1:
      blocks:
        - id: auto_s1
          type: Box
          style:
            height: 160
            background: "#13c2c2"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: auto_s1_text
              type: Title
              properties:
                content: Auto Slide 1
                level: 3
              style:
                color: white
    auto_s2:
      blocks:
        - id: auto_s2
          type: Box
          style:
            height: 160
            background: "#1677ff"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: auto_s2_text
              type: Title
              properties:
                content: Auto Slide 2
                level: 3
              style:
                color: white
    auto_s3:
      blocks:
        - id: auto_s3
          type: Box
          style:
            height: 160
            background: "#722ed1"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: auto_s3_text
              type: Title
              properties:
                content: Auto Slide 3
                level: 3
              style:
                color: white
    auto_s4:
      blocks:
        - id: auto_s4
          type: Box
          style:
            height: 160
            background: "#eb2f96"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: auto_s4_text
              type: Title
              properties:
                content: Auto Slide 4
                level: 3
              style:
                color: white
```

Hover to Pause

Autoplay Resumes

On Mouse Leave

```yaml
- id: pause_carousel
  type: Carousel
  properties:
    autoplay: true
    autoplaySpeed: 1500
    pauseOnHover: true
    pauseOnFocus: true
  slots:
    pause_s1:
      blocks:
        - id: pause_s1
          type: Box
          style:
            height: 160
            background: "#389e0d"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: pause_s1_text
              type: Title
              properties:
                content: Hover to Pause
                level: 3
              style:
                color: white
    pause_s2:
      blocks:
        - id: pause_s2
          type: Box
          style:
            height: 160
            background: "#08979c"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: pause_s2_text
              type: Title
              properties:
                content: Autoplay Resumes
                level: 3
              style:
                color: white
    pause_s3:
      blocks:
        - id: pause_s3
          type: Box
          style:
            height: 160
            background: "#531dab"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: pause_s3_text
              type: Title
              properties:
                content: On Mouse Leave
                level: 3
              style:
                color: white
```

Dots on Top

Navigation Above

Slide Content

```yaml
- id: dot_top_carousel
  type: Carousel
  properties:
    dotPosition: top
  slots:
    dot_top_s1:
      blocks:
        - id: dot_top_s1
          type: Box
          style:
            height: 160
            background: "#fa8c16"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_top_s1_text
              type: Title
              properties:
                content: Dots on Top
                level: 3
              style:
                color: white
    dot_top_s2:
      blocks:
        - id: dot_top_s2
          type: Box
          style:
            height: 160
            background: "#d46b08"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_top_s2_text
              type: Title
              properties:
                content: Navigation Above
                level: 3
              style:
                color: white
    dot_top_s3:
      blocks:
        - id: dot_top_s3
          type: Box
          style:
            height: 160
            background: "#ad4e00"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_top_s3_text
              type: Title
              properties:
                content: Slide Content
                level: 3
              style:
                color: white
```

Dots on Left

Vertical Dots

Side Navigation

```yaml
- id: dot_left_carousel
  type: Carousel
  properties:
    dotPosition: left
  slots:
    dot_left_s1:
      blocks:
        - id: dot_left_s1
          type: Box
          style:
            height: 200
            background: "#13c2c2"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_left_s1_text
              type: Title
              properties:
                content: Dots on Left
                level: 3
              style:
                color: white
    dot_left_s2:
      blocks:
        - id: dot_left_s2
          type: Box
          style:
            height: 200
            background: "#006d75"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_left_s2_text
              type: Title
              properties:
                content: Vertical Dots
                level: 3
              style:
                color: white
    dot_left_s3:
      blocks:
        - id: dot_left_s3
          type: Box
          style:
            height: 200
            background: "#00474f"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_left_s3_text
              type: Title
              properties:
                content: Side Navigation
                level: 3
              style:
                color: white
```

Dots on Right

Right Aligned

Navigation

```yaml
- id: dot_right_carousel
  type: Carousel
  properties:
    dotPosition: right
  slots:
    dot_right_s1:
      blocks:
        - id: dot_right_s1
          type: Box
          style:
            height: 200
            background: "#eb2f96"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_right_s1_text
              type: Title
              properties:
                content: Dots on Right
                level: 3
              style:
                color: white
    dot_right_s2:
      blocks:
        - id: dot_right_s2
          type: Box
          style:
            height: 200
            background: "#c41d7f"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_right_s2_text
              type: Title
              properties:
                content: Right Aligned
                level: 3
              style:
                color: white
    dot_right_s3:
      blocks:
        - id: dot_right_s3
          type: Box
          style:
            height: 200
            background: "#9e1068"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: dot_right_s3_text
              type: Title
              properties:
                content: Navigation
                level: 3
              style:
                color: white
```

Fade Transition

Smooth Crossfade

Between Slides

```yaml
- id: fade_carousel
  type: Carousel
  properties:
    effect: fade
  slots:
    fade_s1:
      blocks:
        - id: fade_s1
          type: Box
          style:
            height: 180
            background: "#531dab"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_s1_text
              type: Title
              properties:
                content: Fade Transition
                level: 3
              style:
                color: white
    fade_s2:
      blocks:
        - id: fade_s2
          type: Box
          style:
            height: 180
            background: "#08979c"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_s2_text
              type: Title
              properties:
                content: Smooth Crossfade
                level: 3
              style:
                color: white
    fade_s3:
      blocks:
        - id: fade_s3
          type: Box
          style:
            height: 180
            background: "#d4380d"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_s3_text
              type: Title
              properties:
                content: Between Slides
                level: 3
              style:
                color: white
```

Gradient Violet

Gradient Pink

Gradient Cyan

Gradient Mint

```yaml
- id: fade_auto_carousel
  type: Carousel
  properties:
    effect: fade
    autoplay: true
    autoplaySpeed: 2500
  slots:
    fade_auto_s1:
      blocks:
        - id: fade_auto_s1
          type: Box
          style:
            height: 180
            background: linear-gradient(135deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_auto_s1_text
              type: Title
              properties:
                content: Gradient Violet
                level: 3
              style:
                color: white
    fade_auto_s2:
      blocks:
        - id: fade_auto_s2
          type: Box
          style:
            height: 180
            background: linear-gradient(135deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_auto_s2_text
              type: Title
              properties:
                content: Gradient Pink
                level: 3
              style:
                color: white
    fade_auto_s3:
      blocks:
        - id: fade_auto_s3
          type: Box
          style:
            height: 180
            background: linear-gradient(135deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_auto_s3_text
              type: Title
              properties:
                content: Gradient Cyan
                level: 3
              style:
                color: white
    fade_auto_s4:
      blocks:
        - id: fade_auto_s4
          type: Box
          style:
            height: 180
            background: linear-gradient(135deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fade_auto_s4_text
              type: Title
              properties:
                content: Gradient Mint
                level: 3
              style:
                color: white
```

Navigate with Arrows

Click Left or Right

To Change Slides

Arrow Navigation

```yaml
- id: arrows_carousel
  type: Carousel
  properties:
    arrows: true
  slots:
    arrows_s1:
      blocks:
        - id: arrows_s1
          type: Box
          style:
            height: 180
            background: "#389e0d"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_s1_text
              type: Title
              properties:
                content: Navigate with Arrows
                level: 3
              style:
                color: white
    arrows_s2:
      blocks:
        - id: arrows_s2
          type: Box
          style:
            height: 180
            background: "#1d39c4"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_s2_text
              type: Title
              properties:
                content: Click Left or Right
                level: 3
              style:
                color: white
    arrows_s3:
      blocks:
        - id: arrows_s3
          type: Box
          style:
            height: 180
            background: "#c41d7f"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_s3_text
              type: Title
              properties:
                content: To Change Slides
                level: 3
              style:
                color: white
    arrows_s4:
      blocks:
        - id: arrows_s4
          type: Box
          style:
            height: 180
            background: "#d4380d"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_s4_text
              type: Title
              properties:
                content: Arrow Navigation
                level: 3
              style:
                color: white
```

Arrows Only

No Dot Indicators

Clean Navigation

```yaml
- id: arrows_nodots_carousel
  type: Carousel
  properties:
    arrows: true
    dots: false
  slots:
    arrows_nodots_s1:
      blocks:
        - id: arrows_nodots_s1
          type: Box
          style:
            height: 160
            background: "#faad14"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_nodots_s1_text
              type: Title
              properties:
                content: Arrows Only
                level: 3
              style:
                color: white
    arrows_nodots_s2:
      blocks:
        - id: arrows_nodots_s2
          type: Box
          style:
            height: 160
            background: "#d48806"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_nodots_s2_text
              type: Title
              properties:
                content: No Dot Indicators
                level: 3
              style:
                color: white
    arrows_nodots_s3:
      blocks:
        - id: arrows_nodots_s3
          type: Box
          style:
            height: 160
            background: "#ad6800"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: arrows_nodots_s3_text
              type: Title
              properties:
                content: Clean Navigation
                level: 3
              style:
                color: white
```

1

2

3

4

5

6

```yaml
- id: multi_carousel
  type: Carousel
  properties:
    slidesToShow: 3
    slidesToScroll: 1
  slots:
    multi_s1:
      blocks:
        - id: multi_s1
          type: Box
          style:
            height: 140
            background: "#1677ff"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
          blocks:
            - id: multi_s1_text
              type: Title
              properties:
                content: "1"
                level: 3
              style:
                color: white
    multi_s2:
      blocks:
        - id: multi_s2
          type: Box
          style:
            height: 140
            background: "#4096ff"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
          blocks:
            - id: multi_s2_text
              type: Title
              properties:
                content: "2"
                level: 3
              style:
                color: white
    multi_s3:
      blocks:
        - id: multi_s3
          type: Box
          style:
            height: 140
            background: "#69b1ff"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
          blocks:
            - id: multi_s3_text
              type: Title
              properties:
                content: "3"
                level: 3
              style:
                color: white
    multi_s4:
      blocks:
        - id: multi_s4
          type: Box
          style:
            height: 140
            background: "#91caff"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
          blocks:
            - id: multi_s4_text
              type: Title
              properties:
                content: "4"
                level: 3
              style:
                color: white
    multi_s5:
      blocks:
        - id: multi_s5
          type: Box
          style:
            height: 140
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
          blocks:
            - id: multi_s5_text
              type: Title
              properties:
                content: "5"
                level: 3
              style:
                color: "#1677ff"
    multi_s6:
      blocks:
        - id: multi_s6
          type: Box
          style:
            height: 140
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
          blocks:
            - id: multi_s6_text
              type: Title
              properties:
                content: "6"
                level: 3
              style:
                color: "#1677ff"
```

First Slide

Middle Slide

Last Slide (Stops Here)

```yaml
- id: finite_carousel
  type: Carousel
  properties:
    infinite: false
    arrows: true
  slots:
    finite_s1:
      blocks:
        - id: finite_s1
          type: Box
          style:
            height: 160
            background: "#cf1322"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: finite_s1_text
              type: Title
              properties:
                content: First Slide
                level: 3
              style:
                color: white
    finite_s2:
      blocks:
        - id: finite_s2
          type: Box
          style:
            height: 160
            background: "#a8071a"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: finite_s2_text
              type: Title
              properties:
                content: Middle Slide
                level: 3
              style:
                color: white
    finite_s3:
      blocks:
        - id: finite_s3
          type: Box
          style:
            height: 160
            background: "#820014"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: finite_s3_text
              type: Title
              properties:
                content: Last Slide (Stops Here)
                level: 3
              style:
                color: white
```

Launch Fast

Build and deploy web apps in record time with config-driven development.

Production Ready

Enterprise-grade applications with built-in auth, roles, and security.

Connect Anything

Integrate with databases, REST APIs, and GraphQL endpoints effortlessly.

```yaml
- id: rich_carousel
  type: Carousel
  properties:
    autoplay: true
    autoplaySpeed: 4000
  slots:
    rich_s1:
      blocks:
        - id: rich_s1
          type: Box
          style:
            height: 220
            background: linear-gradient(135deg,
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
            padding: 24px
          blocks:
            - id: rich_s1_icon
              type: Icon
              properties:
                name: AiOutlineRocket
                size: 40
                color: white
            - id: rich_s1_title
              type: Title
              properties:
                content: Launch Fast
                level: 3
              style:
                color: white
                marginTop: 12
                marginBottom: 0
            - id: rich_s1_desc
              type: Paragraph
              properties:
                content: Build and deploy web apps in record time with config-driven
                  development.
              style:
                color: rgba(255, 255, 255, 0.85)
                textAlign: center
                maxWidth: 400
    rich_s2:
      blocks:
        - id: rich_s2
          type: Box
          style:
            height: 220
            background: linear-gradient(135deg,
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
            padding: 24px
          blocks:
            - id: rich_s2_icon
              type: Icon
              properties:
                name: AiOutlineCheckCircle
                size: 40
                color: white
            - id: rich_s2_title
              type: Title
              properties:
                content: Production Ready
                level: 3
              style:
                color: white
                marginTop: 12
                marginBottom: 0
            - id: rich_s2_desc
              type: Paragraph
              properties:
                content: Enterprise-grade applications with built-in auth, roles, and security.
              style:
                color: rgba(255, 255, 255, 0.85)
                textAlign: center
                maxWidth: 400
    rich_s3:
      blocks:
        - id: rich_s3
          type: Box
          style:
            height: 220
            background: linear-gradient(135deg,
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
            padding: 24px
          blocks:
            - id: rich_s3_icon
              type: Icon
              properties:
                name: AiOutlineApi
                size: 40
                color: white
            - id: rich_s3_title
              type: Title
              properties:
                content: Connect Anything
                level: 3
              style:
                color: white
                marginTop: 12
                marginBottom: 0
            - id: rich_s3_desc
              type: Paragraph
              properties:
                content: Integrate with databases, REST APIs, and GraphQL endpoints
                  effortlessly.
              style:
                color: rgba(255, 255, 255, 0.85)
                textAlign: center
                maxWidth: 400
```

Monitor your app metrics and KPIs at a glance with customizable widgets and real-time data.

Handle roles, permissions, and team invitations with a built-in authentication layer.

Create complex multi-step forms with validation, conditional logic, and file uploads.

Automate business processes with triggers, conditions, and multi-step action sequences.

```yaml
- id: card_carousel
  type: Carousel
  properties:
    slidesToShow: 2
    slidesToScroll: 1
    arrows: true
  slots:
    card_s1:
      blocks:
        - id: card_s1
          type: Box
          style:
            padding: 12px
          blocks:
            - id: card_s1_card
              type: Card
              properties:
                title: Dashboard
                bordered: true
              blocks:
                - id: card_s1_card_desc
                  type: Paragraph
                  properties:
                    content: Monitor your app metrics and KPIs at a glance with customizable widgets
                      and real-time data.
                - id: card_s1_card_tag
                  type: Tag
                  properties:
                    title: Analytics
                    color: blue
    card_s2:
      blocks:
        - id: card_s2
          type: Box
          style:
            padding: 12px
          blocks:
            - id: card_s2_card
              type: Card
              properties:
                title: User Management
                bordered: true
              blocks:
                - id: card_s2_card_desc
                  type: Paragraph
                  properties:
                    content: Handle roles, permissions, and team invitations with a built-in
                      authentication layer.
                - id: card_s2_card_tag
                  type: Tag
                  properties:
                    title: Security
                    color: green
    card_s3:
      blocks:
        - id: card_s3
          type: Box
          style:
            padding: 12px
          blocks:
            - id: card_s3_card
              type: Card
              properties:
                title: Form Builder
                bordered: true
              blocks:
                - id: card_s3_card_desc
                  type: Paragraph
                  properties:
                    content: Create complex multi-step forms with validation, conditional logic, and
                      file uploads.
                - id: card_s3_card_tag
                  type: Tag
                  properties:
                    title: Input
                    color: purple
    card_s4:
      blocks:
        - id: card_s4
          type: Box
          style:
            padding: 12px
          blocks:
            - id: card_s4_card
              type: Card
              properties:
                title: Workflow Engine
                bordered: true
              blocks:
                - id: card_s4_card_desc
                  type: Paragraph
                  properties:
                    content: Automate business processes with triggers, conditions, and multi-step
                      action sequences.
                - id: card_s4_card_tag
                  type: Tag
                  properties:
                    title: Automation
                    color: orange
```

Soft Blue

Fresh Lime

Warm Sunset

Lavender Mist

Coral Sunrise

```yaml
- id: gradient_carousel
  type: Carousel
  properties:
    effect: fade
    autoplay: true
    autoplaySpeed: 3000
  slots:
    grad_s1:
      blocks:
        - id: grad_s1
          type: Box
          style:
            height: 200
            background: linear-gradient(120deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: grad_s1_text
              type: Title
              properties:
                content: Soft Blue
                level: 2
              style:
                color: "#1d39c4"
    grad_s2:
      blocks:
        - id: grad_s2
          type: Box
          style:
            height: 200
            background: linear-gradient(120deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: grad_s2_text
              type: Title
              properties:
                content: Fresh Lime
                level: 2
              style:
                color: "#135200"
    grad_s3:
      blocks:
        - id: grad_s3
          type: Box
          style:
            height: 200
            background: linear-gradient(120deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: grad_s3_text
              type: Title
              properties:
                content: Warm Sunset
                level: 2
              style:
                color: "#610b00"
    grad_s4:
      blocks:
        - id: grad_s4
          type: Box
          style:
            height: 200
            background: linear-gradient(120deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: grad_s4_text
              type: Title
              properties:
                content: Lavender Mist
                level: 2
              style:
                color: "#391085"
    grad_s5:
      blocks:
        - id: grad_s5
          type: Box
          style:
            height: 200
            background: linear-gradient(120deg,
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: grad_s5_text
              type: Title
              properties:
                content: Coral Sunrise
                level: 2
              style:
                color: white
```

Drag to Navigate

Click and Drag

On Desktop

Swipe on Mobile

```yaml
- id: drag_carousel
  type: Carousel
  properties:
    draggable: true
    swipeToSlide: true
  slots:
    drag_s1:
      blocks:
        - id: drag_s1
          type: Box
          style:
            height: 160
            background: "#2f54eb"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: drag_s1_text
              type: Title
              properties:
                content: Drag to Navigate
                level: 3
              style:
                color: white
    drag_s2:
      blocks:
        - id: drag_s2
          type: Box
          style:
            height: 160
            background: "#597ef7"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: drag_s2_text
              type: Title
              properties:
                content: Click and Drag
                level: 3
              style:
                color: white
    drag_s3:
      blocks:
        - id: drag_s3
          type: Box
          style:
            height: 160
            background: "#85a5ff"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: drag_s3_text
              type: Title
              properties:
                content: On Desktop
                level: 3
              style:
                color: white
    drag_s4:
      blocks:
        - id: drag_s4
          type: Box
          style:
            height: 160
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: drag_s4_text
              type: Title
              properties:
                content: Swipe on Mobile
                level: 3
              style:
                color: "#2f54eb"
```

Center Mode

Peek at Adjacent

Slide Previews

With Padding

```yaml
- id: center_carousel
  type: Carousel
  properties:
    centerMode: true
    centerPadding: 60px
    slidesToShow: 1
  slots:
    center_s1:
      blocks:
        - id: center_s1
          type: Box
          style:
            height: 160
            background: "#faad14"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
            borderRadius: 8
          blocks:
            - id: center_s1_text
              type: Title
              properties:
                content: Center Mode
                level: 3
              style:
                color: white
    center_s2:
      blocks:
        - id: center_s2
          type: Box
          style:
            height: 160
            background: "#d48806"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
            borderRadius: 8
          blocks:
            - id: center_s2_text
              type: Title
              properties:
                content: Peek at Adjacent
                level: 3
              style:
                color: white
    center_s3:
      blocks:
        - id: center_s3
          type: Box
          style:
            height: 160
            background: "#ad6800"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
            borderRadius: 8
          blocks:
            - id: center_s3_text
              type: Title
              properties:
                content: Slide Previews
                level: 3
              style:
                color: white
    center_s4:
      blocks:
        - id: center_s4
          type: Box
          style:
            height: 160
            background: "#874d00"
            display: flex
            alignItems: center
            justifyContent: center
            margin: 0 8px
            borderRadius: 8
          blocks:
            - id: center_s4_text
              type: Title
              properties:
                content: With Padding
                level: 3
              style:
                color: white
```

Tailwind Gradients

Use Tailwind utility classes on slides

Green to Cyan

Combine class and style for full control

Rose to Orange

Beautiful color transitions

Violet to Fuchsia

Rich purple gradients

```yaml
- id: css_carousel
  type: Carousel
  slots:
    css_s1:
      blocks:
        - id: css_s1
          type: Box
          class: bg-gradient-to-br from-primary/100 to-indigo-600
          style:
            height: 200
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
          blocks:
            - id: css_s1_title
              type: Title
              properties:
                content: Tailwind Gradients
                level: 2
              style:
                color: white
                marginBottom: 0
            - id: css_s1_sub
              type: Paragraph
              properties:
                content: Use Tailwind utility classes on slides
              style:
                color: rgba(255, 255, 255, 0.8)
    css_s2:
      blocks:
        - id: css_s2
          type: Box
          class: bg-gradient-to-br from-emerald-400 to-cyan-500
          style:
            height: 200
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
          blocks:
            - id: css_s2_title
              type: Title
              properties:
                content: Green to Cyan
                level: 2
              style:
                color: white
                marginBottom: 0
            - id: css_s2_sub
              type: Paragraph
              properties:
                content: Combine class and style for full control
              style:
                color: rgba(255, 255, 255, 0.8)
    css_s3:
      blocks:
        - id: css_s3
          type: Box
          class: bg-gradient-to-br from-rose-400 to-orange-400
          style:
            height: 200
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
          blocks:
            - id: css_s3_title
              type: Title
              properties:
                content: Rose to Orange
                level: 2
              style:
                color: white
                marginBottom: 0
            - id: css_s3_sub
              type: Paragraph
              properties:
                content: Beautiful color transitions
              style:
                color: rgba(255, 255, 255, 0.8)
    css_s4:
      blocks:
        - id: css_s4
          type: Box
          class: bg-gradient-to-br from-violet-500 to-fuchsia-500
          style:
            height: 200
            display: flex
            flexDirection: column
            alignItems: center
            justifyContent: center
          blocks:
            - id: css_s4_title
              type: Title
              properties:
                content: Violet to Fuchsia
                level: 2
              style:
                color: white
                marginBottom: 0
            - id: css_s4_sub
              type: Paragraph
              properties:
                content: Rich purple gradients
              style:
                color: rgba(255, 255, 255, 0.8)
```

**Slow transition (1500ms):**

Slow and Smooth

Ease In Out

1.5 Second Slide

**Fast transition (200ms):**

Quick Snap

200ms Transition

Instant Feel

```yaml
- id: speed_label
  type: Markdown
  properties:
    content: "**Slow transition (1500ms):**"
- id: slow_carousel
  type: Carousel
  properties:
    speed: 1500
    easing: ease-in-out
  slots:
    slow_s1:
      blocks:
        - id: slow_s1
          type: Box
          style:
            height: 140
            background: "#595959"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: slow_s1_text
              type: Title
              properties:
                content: Slow and Smooth
                level: 3
              style:
                color: white
    slow_s2:
      blocks:
        - id: slow_s2
          type: Box
          style:
            height: 140
            background: "#434343"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: slow_s2_text
              type: Title
              properties:
                content: Ease In Out
                level: 3
              style:
                color: white
    slow_s3:
      blocks:
        - id: slow_s3
          type: Box
          style:
            height: 140
            background: "#262626"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: slow_s3_text
              type: Title
              properties:
                content: 1.5 Second Slide
                level: 3
              style:
                color: white
- id: fast_label
  type: Markdown
  properties:
    content: "**Fast transition (200ms):**"
- id: fast_carousel
  type: Carousel
  properties:
    speed: 200
  slots:
    fast_s1:
      blocks:
        - id: fast_s1
          type: Box
          style:
            height: 140
            background: "#ff4d4f"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fast_s1_text
              type: Title
              properties:
                content: Quick Snap
                level: 3
              style:
                color: white
    fast_s2:
      blocks:
        - id: fast_s2
          type: Box
          style:
            height: 140
            background: "#ff7875"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fast_s2_text
              type: Title
              properties:
                content: 200ms Transition
                level: 3
              style:
                color: white
    fast_s3:
      blocks:
        - id: fast_s3
          type: Box
          style:
            height: 140
            background: "#ffa39e"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: fast_s3_text
              type: Title
              properties:
                content: Instant Feel
                level: 3
              style:
                color: "#cf1322"
```

Large Dots

Custom Indicators

More Visible

```yaml
- id: theme_large_dots_carousel
  type: Carousel
  properties:
    theme:
      dotWidth: 24
      dotHeight: 6
      dotActiveWidth: 40
  slots:
    theme_ld_s1:
      blocks:
        - id: theme_ld_s1
          type: Box
          style:
            height: 160
            background: "#1677ff"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_ld_s1_text
              type: Title
              properties:
                content: Large Dots
                level: 3
              style:
                color: white
    theme_ld_s2:
      blocks:
        - id: theme_ld_s2
          type: Box
          style:
            height: 160
            background: "#4096ff"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_ld_s2_text
              type: Title
              properties:
                content: Custom Indicators
                level: 3
              style:
                color: white
    theme_ld_s3:
      blocks:
        - id: theme_ld_s3
          type: Box
          style:
            height: 160
            background: "#69b1ff"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_ld_s3_text
              type: Title
              properties:
                content: More Visible
                level: 3
              style:
                color: white
```

Round Dots

Circular Indicators

Same Width Active

```yaml
- id: theme_round_dots_carousel
  type: Carousel
  properties:
    theme:
      dotWidth: 12
      dotHeight: 12
      dotActiveWidth: 12
  slots:
    theme_rd_s1:
      blocks:
        - id: theme_rd_s1
          type: Box
          style:
            height: 160
            background: "#52c41a"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_rd_s1_text
              type: Title
              properties:
                content: Round Dots
                level: 3
              style:
                color: white
    theme_rd_s2:
      blocks:
        - id: theme_rd_s2
          type: Box
          style:
            height: 160
            background: "#73d13d"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_rd_s2_text
              type: Title
              properties:
                content: Circular Indicators
                level: 3
              style:
                color: white
    theme_rd_s3:
      blocks:
        - id: theme_rd_s3
          type: Box
          style:
            height: 160
            background: "#95de64"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_rd_s3_text
              type: Title
              properties:
                content: Same Width Active
                level: 3
              style:
                color: "#135200"
```

Larger Arrows

More Prominent

Navigation Controls

```yaml
- id: theme_large_arrows_carousel
  type: Carousel
  properties:
    arrows: true
    theme:
      arrowSize: 24
      arrowOffset: 16
  slots:
    theme_la_s1:
      blocks:
        - id: theme_la_s1
          type: Box
          style:
            height: 180
            background: "#722ed1"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_la_s1_text
              type: Title
              properties:
                content: Larger Arrows
                level: 3
              style:
                color: white
    theme_la_s2:
      blocks:
        - id: theme_la_s2
          type: Box
          style:
            height: 180
            background: "#9254de"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_la_s2_text
              type: Title
              properties:
                content: More Prominent
                level: 3
              style:
                color: white
    theme_la_s3:
      blocks:
        - id: theme_la_s3
          type: Box
          style:
            height: 180
            background: "#b37feb"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_la_s3_text
              type: Title
              properties:
                content: Navigation Controls
                level: 3
              style:
                color: white
```

Spaced Dots

Wide Gap

More Offset

Custom Spacing

```yaml
- id: theme_spaced_dots_carousel
  type: Carousel
  properties:
    theme:
      dotGap: 12
      dotOffset: 20
      dotWidth: 20
      dotHeight: 4
      dotActiveWidth: 36
  slots:
    theme_sd_s1:
      blocks:
        - id: theme_sd_s1
          type: Box
          style:
            height: 160
            background: "#eb2f96"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_sd_s1_text
              type: Title
              properties:
                content: Spaced Dots
                level: 3
              style:
                color: white
    theme_sd_s2:
      blocks:
        - id: theme_sd_s2
          type: Box
          style:
            height: 160
            background: "#f759ab"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_sd_s2_text
              type: Title
              properties:
                content: Wide Gap
                level: 3
              style:
                color: white
    theme_sd_s3:
      blocks:
        - id: theme_sd_s3
          type: Box
          style:
            height: 160
            background: "#ff85c0"
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_sd_s3_text
              type: Title
              properties:
                content: More Offset
                level: 3
              style:
                color: white
    theme_sd_s4:
      blocks:
        - id: theme_sd_s4
          type: Box
          style:
            height: 160
            display: flex
            alignItems: center
            justifyContent: center
          blocks:
            - id: theme_sd_s4_text
              type: Title
              properties:
                content: Custom Spacing
                level: 3
              style:
                color: "#c41d7f"
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `accessibility` | boolean | `true` | Enable tabbing and arrow key navigation. |
| `adaptiveHeight` | boolean | `false` | Adjust the slide's height automatically. |
| `arrows` | boolean | `false` | Whether or not to show arrows. |
| `autoplaySpeed` | integer | `3000` | Delay between each auto scroll (in milliseconds). |
| `autoplay` | boolean | `false` | Toggles whether or not to scroll automatically. |
| `centerMode` | boolean | `false` | Center current slide. |
| `centerPadding` | string | `"50px"` | Padding applied to center slide. |
| `dotPosition` | string | `"bottom"` | The position of the dots, which can be one of top, bottom, left or right. Enum: `left`, `right`, `top`, `bottom`. |
| `dots` | boolean | `true` | Whether or not to show the dots. |
| `draggable` | boolean | `false` | Enable scrollable via dragging on desktop |
| `easing` | string | `"linear"` | Transition interpolation function name. |
| `effect` | string | `"scrollx"` | Transition effect, either scrollx or fade. |
| `focusOnSelect` | boolean | `false` | Go to slide on click. |
| `infinite` | boolean | `true` | Infinitely wrap around contents. |
| `pauseOnDotsHover` | boolean | `false` | Prevents autoplay while hovering on dot. |
| `pauseOnFocus` | boolean | `false` | Prevents autoplay while focused on slides. |
| `pauseOnHover` | boolean | `true` | Prevents autoplay while hovering on track. |
| `responsive` | array | `[]` | Customize based on breakpoints. |
| `responsive.$.breakpoint` | integer | - | Maximum screen size. |
| `responsive.$.settings` | object | - | Carousel properties. |
| `rows` | integer | `1` | Number of rows per slide in the slider, (enables grid mode). |
| `rtl` | boolean | `false` | Reverses the slide order. |
| `slides` | array | - | Optional list of slides for explicit ordering and metadata. Each entry must have a `key` matching a slot name. When omitted, every defined slot becomes a slide, ordered alphabetically by key. Each entry is passed to `afterChange` and `beforeChange` events as `event.current` and `event.next` — any extra fields on the entry (e.g. a title or analytics id) are available there. |
| `slides.$.key` | string | - | Slot key for this slide. |
| `slidesPerRow` | integer | `1` | Number of slides to display in grid mode, this is useful with rows option. |
| `slidesToScroll` | integer | `1` | How many slides to scroll at once. |
| `slidesToShow` | integer | `1` | How many slides to show in one frame. |
| `speed` | integer | `500` | Number of slides to display in grid mode, this is useful with rows option. |
| `swipeToSlide` | boolean | `false` | Enable drag/swipe irrespective of `slidesToScroll`. |
| `swipe` | boolean | `true` | Enable/disable swiping to change slides. |
| `vertical` | boolean | `false` | Whether or not the slides are shown in a column. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design carousel tokens](https://ant.design/components/carousel#design-token). |
| `theme.dotWidth` | number | `16` | Width of the indicator dot. |
| `theme.dotHeight` | number | `3` | Height of the indicator dot. |
| `theme.dotGap` | number | `4` | Gap between indicator dots. |
| `theme.dotOffset` | number | `12` | Offset distance of dots from the carousel edge. |
| `theme.dotActiveWidth` | number | `24` | Width of the active indicator dot. |
| `theme.arrowSize` | number | `16` | Size of the navigation arrows. |
| `theme.arrowOffset` | number | `8` | Offset distance of arrows from the carousel edge. |
| `theme.colorBgContainer` | string | - | Background color used for indicator dots. |

| Event | Event Data | Description |
| --- | --- | --- |
| `afterChange` | \- | Trigger actions after the slide is changed. |
| `beforeChange` | \- | Trigger actions before the slide is changed. |
| `onInit` | \- | Trigger actions when the carousel is initialized. |
| `onSwipe` | \- | Trigger actions when the carousel is swiped. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Carousel element. |

Slot keys are user-defined in your config and resolved at build time — not generated at runtime. The block typically pairs slots with an array property (`tabs`, `panels`, `slides`) listed in the Properties table; see the examples above for the expected shape.
