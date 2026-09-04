const colors = { positive: 'green', negative: 'red' };

function tone(name) {
  return colors[name] ?? 'grey';
}

export default tone;
