### Validate action

We can now add a `Validate` action to the submit button. This will validate the inputs and give an error if any inputs are not filled in.

#### Step 2
Add the validate action like this:

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
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          type: primary
          icon: SaveOutlined
################ -------- Copy from here -------- ################
        actions:
          onClick:
            - id: validate
              type: Validate
################ ------- Copy to here ----------- ################
```

Now if we click the submit button and all our inputs aren't complete, a message pops up saying we have validation errors on the page. All the fields that have not been completed are highlighted in red.

The result should look and work like this. The examples in this tutorial are live versions of the tutorial app, so you can verify that they work like your own app.