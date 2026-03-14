'use client';

import { useEffect, useState, useRef } from 'react';

function Counter({ end, suffix = '', duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting && !countRef.current) {
        countRef.current = true;
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
      }
    }, { threshold: 0.1 });

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <div ref={elementRef}>{count}{suffix}</div>;
}

export default function Metrics() {
  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2 font-mono">
              <Counter end={500} suffix="+" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Organizations Onboarded</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2 font-mono">
              <Counter end={1.2} suffix="M+" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Tasks Completed</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2 font-mono">
              <Counter end={4} suffix=" hrs" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Avg. KYC Turnaround</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2 font-mono">
              <Counter end={8} suffix="M+" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Audit Logs Stored</p>
          </div>
        </div>
      </div>
    </section>
  );
}
