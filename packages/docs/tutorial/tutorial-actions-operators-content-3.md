### What happened

The validate action we added to the submit button evaluates all the input blocks on the page, and gives an error if any of them fail the validation. This will also stop the execution of any actions after that action. This means we won't insert the data into our database later. The first time a validate action is called on a page it sets a flag that tells all the input blocks to show their validation errors.

## Advanced validations

We would like to only allow users to book the boardroom if there are 8 or more attendees in the meeting. We can use [operators](operators) to do this test.

#### Step 1
Add a [`ButtonSelector`](ButtonSelector) for the number of attendees, and add a `validate` rule to the `meeting_room` selector.

##### `pages/booking.yaml`
```yaml
id: booking
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      # ...
      - id: meeting_name
        type: TextInput
        required: true
        properties:
          title: Meeting Name
################ -------- Copy from here -------- ################
      - id: number_of_attendees
        type: ButtonSelector
        required: true
        properties:
          title: Number of Attendees
          options:
            - 1 - 2
            - 3 - 7
            - 8 - 12
################ ------- Copy to here ----------- ################
      - id: meeting_room
        type: Selector
        required: true
        properties:
          title: Meeting Room
          options:
            - Meeting Room 1
            - Meeting Room 2
            - Meeting Room 3
            - Boardroom
################ -------- Copy from here -------- ################
        validate:
          - message: The boardroom cannot be booked for meetings with less than 8 attendees.
            status: error
            pass:
              _or:
                - _eq:
                    - _state: number_of_attendees
                    - 8 - 12
                - _not:
                    _eq:
                      - _state: meeting_room
                      - Boardroom
################ ------- Copy to here ----------- ################
        - id: date
        type: DateSelector
        required: true
        properties:
          title: Date
           # ...
```

If you select the boardroom, and don't select 8 - 12 attendees, the error message of the `meeting_room` block should read: "The boardroom cannot be booked for meetings with less than 8 attendees."


#### Step 2
Change the status property of the validation from `error` to `warning`. Then the  `meeting_room` block will be highlighted in orange when the rule is not met, and the warning will appear before the `Validate` action is called. The action will also not error when the rule is not met, so a user will still be able to submit the data.

Your final result should look and work like this:
