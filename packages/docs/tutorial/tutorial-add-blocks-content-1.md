We would like to add an input form with the following fields:

- A name for the meeting.
- Which meeting room should be booked. This should be a selection from a list of meeting rooms.
- The date of the meeting.
- The start and end times for the meeting.

There should also be submit and reset buttons at the bottom of the page.

#### Step 1

Copy the following blocks and add them in the card's blocks array.

###### `pages/booking.yaml`
```yaml
id: booking
    # ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Book a meeting room # Change the title on the page
          level: 3 # Make the title a little smaller (an html `<h3>`).
################ -------- Copy from here -------- ################
      - id: meeting_name
        type: TextInput
        properties:
          title: Meeting name
      - id: meeting_room
        type: Selector
        properties:
          title: Meeting room
          options: # Set the allowed options
            - Red Room
            - Blue Room
            - Green Room
            - Boardroom
      - id: date
        type: DateSelector
        properties:
          title: Date
      - id: start_time
        type: DateTimeSelector
        properties:
          title: Start time
      - id: end_time
        type: DateTimeSelector
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
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          type: primary # Make the button a primary button with color
          icon: SaveOutlined
```

>  If you would like to see how your config should look at this point, you can find it [here](tutorial-add-blocks-config).

#### Step 2

Your booking page should something like this: