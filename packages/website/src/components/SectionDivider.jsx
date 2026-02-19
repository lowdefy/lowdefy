export default function SectionDivider({ accent = 'primary' }) {
  const colors = {
    primary: {
      line: 'border-primary-500/20',
      dot: 'bg-primary-500/40',
      glow: 'shadow-[0_0_6px_rgba(25,144,255,0.3)]',
    },
    red: {
      line: 'border-red-500/20',
      dot: 'bg-red-500/40',
      glow: 'shadow-[0_0_6px_rgba(248,113,113,0.3)]',
    },
    green: {
      line: 'border-green-500/20',
      dot: 'bg-green-500/40',
      glow: 'shadow-[0_0_6px_rgba(74,222,128,0.3)]',
    },
    cyan: {
      line: 'border-cyan-500/20',
      dot: 'bg-cyan-500/40',
      glow: 'shadow-[0_0_6px_rgba(34,211,238,0.3)]',
    },
  };

  const c = colors[accent];

  return (
    <div className="relative flex items-center justify-center py-0">
      <div className={`flex-1 border-t ${c.line}`} />
      <div className="flex items-center gap-3 px-4">
        <div className={`w-1.5 h-1.5 ${c.dot} ${c.glow}`} />
        <div className={`w-2 h-2 ${c.dot} ${c.glow} rotate-45`} />
        <div className={`w-1.5 h-1.5 ${c.dot} ${c.glow}`} />
      </div>
      <div className={`flex-1 border-t ${c.line}`} />
    </div>
  );
}
