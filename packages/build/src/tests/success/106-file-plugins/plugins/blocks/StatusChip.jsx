import tone from './lib/tone.js';

function StatusChip({ blockId, properties }) {
  return (
    <span id={blockId} style={{ color: tone(properties.tone) }}>
      {properties.label}
    </span>
  );
}

export default StatusChip;
