# :while

```
({:while: boolean, :do: routine}): void
```

The `:while` control implements a while loop within a routine. The routine defined in the `:do` key will be repeated as long as the test defined using the `:while` key is true.

#### Keys

- `:while: boolean`: __Required__ - The test that will determine whether or not the defined routine should execute again.
- `:do: routine`: __Required__ - The routine to run while the test condition holds.

The `:while` condition is evaluated fresh before every iteration, against the routine's current `state` and `steps`. This is how the loop terminates - the routine in `:do` changes the state or step results that the condition reads.

Unlike `:for`, a `:while` loop does not index the step results of its body. A `:while` has no item to index by, so each iteration overwrites the previous iteration's step results, and `_step: my_step` inside or after the loop reads the value from the latest iteration.

There is no iteration cap and no timeout. A condition that the routine in `:do` never falsifies loops forever, exactly as it would in JavaScript.

#### Examples

###### Simple Example
```
- :set_state:
    count: 0
- :while:
    _lt:
      - _state: count
      - 5
  :do:
    - :log:
        _state: count
    - :set_state:
        count:
          _sum:
            - _state: count
            - 1
```
Logs:
```
0
1
2
3
4
```
