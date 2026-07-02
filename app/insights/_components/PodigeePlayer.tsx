'use client';

import { useEffect, useRef } from 'react';

const PLAYER_SCRIPT_SRC =
  'https://player.podigee-cdn.net/podcast-player/javascripts/podigee-podcast-player.js';

type PodigeePlayerProps = {
  configurationUrl: string;
};

export function PodigeePlayer({ configurationUrl }: PodigeePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.replaceChildren();

    const script = document.createElement('script');
    script.className = 'podigee-podcast-player';
    script.src = PLAYER_SCRIPT_SRC;
    script.dataset.configuration = configurationUrl;
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [configurationUrl]);

  return <div ref={containerRef} className="mt-8 w-full" />;
}
