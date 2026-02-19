# @lowdefy/blocks-loaders

Loading spinner blocks for Lowdefy.

## Block

| Block     | Purpose                  |
| --------- | ------------------------ |
| `Spinner` | Animated loading spinner |

## Usage

```yaml
- id: loader
  type: Spinner
  visible:
    _state: isLoading
  properties:
    size: 40
    color: '#1890ff'
```

## Properties

| Property | Purpose                |
| -------- | ---------------------- |
| `size`   | Spinner size in pixels |
| `color`  | Spinner color          |
| `type`   | Spinner style variant  |

Typically used with `visible` to show/hide during loading states.
