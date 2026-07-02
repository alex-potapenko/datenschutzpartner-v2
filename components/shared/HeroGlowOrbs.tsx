type HeroGlowOrbsProps = {
  /** Default: orbs around a card. Below: orbs under an input field. */
  placement?: 'default' | 'below';
};

export function HeroGlowOrbs({ placement = 'default' }: HeroGlowOrbsProps) {
  const orbs =
    placement === 'below'
      ? [
          { top: 0, left: '-10%', background: '#ef4444' },
          { top: 48, right: '-8%', background: '#7c3aed' },
          { bottom: 48, left: '-12%', background: '#3b82f6' },
          { bottom: 0, right: '-4%', background: '#16a34a' },
        ]
      : [
          { top: '-5%', left: '-8%', background: '#ef4444' },
          { top: '18%', right: '-10%', background: '#7c3aed' },
          { top: '45%', left: '-10%', background: '#3b82f6' },
          { bottom: '-8%', right: '-4%', background: '#16a34a' },
        ];

  return (
    <>
      {orbs.map((orb, index) => (
        <div
          key={index}
          className="pointer-events-none absolute size-40 sm:size-56 lg:size-80"
          style={{
            top: orb.top,
            right: 'right' in orb ? orb.right : undefined,
            bottom: 'bottom' in orb ? orb.bottom : undefined,
            left: 'left' in orb ? orb.left : undefined,
            borderRadius: '50%',
            background: orb.background,
            opacity: 0.16,
            filter: 'blur(96px)',
          }}
          aria-hidden
        />
      ))}
    </>
  );
}
