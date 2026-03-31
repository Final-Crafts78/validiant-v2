'use client';

import { useEffect, useRef, useState } from 'react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const METRICS = [
  {
    label: 'Verified Identities',
    value: 250,
    suffix: 'K+',
    delay: 0,
  },
  {
    label: 'Field Audits Completed',
    value: 1.2,
    suffix: 'M',
    duration: 3000,
    delay: 100,
  },
  {
    label: 'Uptime Finality',
    value: 99.9,
    suffix: '%',
    delay: 200,
  },
  {
    label: 'Global Compliance Nodes',
    value: 45,
    suffix: '',
    delay: 300,
  },
];

function AnimatedCounter({
  end,
  suffix = '',
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    const { current } = elementRef;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const currentCount = progress * end;
      // Handle floating point or integer display
      setCount(
        end % 1 === 0
          ? Math.floor(currentCount)
          : Number(currentCount.toFixed(1))
      );

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return (
    <div ref={elementRef}>
      {count}
      {suffix}
    </div>
  );
}

export default function Metrics() {
  return (
    <section className="bg-blue-600 py-24 lg:py-32 overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {METRICS.map((metric, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} className="text-center">
              <div className="text-4xl md:text-6xl font-black text-white mb-4">
                <AnimatedCounter
                  end={metric.value}
                  suffix={metric.suffix}
                  duration={metric.duration}
                />
              </div>
              <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-blue-100/60">
                {metric.label}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
