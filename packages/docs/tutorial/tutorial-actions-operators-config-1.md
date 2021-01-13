##### `lowdefy.yaml`
```yaml
name: lowdefy-project-template
version: CURRENT_LOWDEFY_VERSION

menus:
  - id: default
    links:
      - id: welcome
        type: MenuLink
        properties:
          icon: HomeOutlined
          title: Home
        pageId: welcome
      - id: booking
        type: MenuLink
        properties:
          icon: CalendarOutlined
          title: Book a meeting
        pageId: booking

pages:
  - _ref: pages/welcome.yaml
  - _ref: pages/booking.yaml
```

##### `pages/booking.yaml`
```yaml
id: booking
type: PageHeaderMenu
properties:
  title: Book meeting
layout:
  contentJustify: center # Center the contents of the page
blocks:
  - id: content_card
    type: Card
    layout:
      size: 800 # Set the size of the card so it does not fill the full screen
      contentGutter: 16 # Make a 16px gap between all blocks in this card
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Book a meeting room # Change the title on the page
          level: 3 # Make the title a little smaller (an html `<h3>`).
      - id: meeting_name
        required: true
        type: TextInput
        properties:
          title: Meeting name
      - id: number_of_attendees
        type: ButtonSelector
        required: true
        properties:
          title: Number of attendees
          options:
            - 2 - 3
            - 4 - 7
            - 8 - 12
      - id: meeting_room
        type: Selector
        required: true
        properties:
          title: Meeting room
          options: # Set the allowed options
            - Red Room
            - Blue Room
            - Green Room
            - Boardroom
        validate:
          - message: The boardroom cannot be booked for meetings with less than 8 attendees.
            status: warning
            pass:
              _or:
                - _eq:
                    - _state: number_of_attendees
                    - 8 - 12
                - _not:
                    _eq:
                      - _state: meeting_room
                      - Boardroom

      - id: date
        type: DateSelector
        required: true
        properties:
          title: Date
      - id: start_time
        type: DateTimeSelector
        required: true
        properties:
          title: Start time
      - id: end_time
        type: DateTimeSelector
        required: true
        properties:
          title: End time
      - id: reset_button
        type: Button
        layout:
          span: 12 # Set the size of the button (span 12 of 24 columns)
        properties:
          title: Reset
          block: true # Make the button fill all the space available to it
          type: default # Make the button a plain button
          icon: ClearOutlined
        actions:
          onClick:
            - id: reset
              type: Reset
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          type: primary # Make the button a primary button with color
          icon: SaveOutlined
        actions:
          onClick:
            - id: validate
              type: Validate
```