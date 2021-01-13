 If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](tutorial-add-blocks-config).

## Adding a reset button

The reset button should reset all the user's inputs. To do this, we can add a reset action to the reset button.

#### Step 1

Copy the following into the definition of the reset button:

##### `pages/booking.yaml`
```yaml
id: booking
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: reset_button
        type: Button
        layout:
          span: 12
        properties:
          title: Reset
          block: true
          type: default
          icon: ClearOutlined
################ -------- Copy from here -------- ################
        actions:
          onClick:
            - id: reset
              type: Reset
################ ------- Copy to here ----------- ################
      - id: submit_button
        type: Button
        # ...
```

If you add some inputs into the form and click the reset button, those inputs should be cleared.

### What happened

Each block defines a set of actions that it fire when a event happens. The button fires an event called `onClick` when it gets clicked. We can add a list of action definitions that will be executed sequentially when this action is fired. We only added one action, the `Reset` action, that resets the page context to the state it was in when it first loaded.

## Required fields

We should validate the data users are submitting to make sure our app has clean data and works as expected. All of the fields in the form are compulsory, and the user should not be able to submit if they are not completed.

#### Step 1

To make the fields required, add a required property to all the input blocks like this:

```yaml
- id: meeting_name
  type: TextInput
  required: true
  properties:
    title: Meeting name
```

A red star should appear next to each input field, looking like this:
