'use client';

import { useEffect, useRef, RefObject } from 'react';
import { gsap, ScrollTrigger } from './gsap';

// Fade in up on scroll
export function useGsapReveal(options?: {
  y?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  scrollTrigger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { y = 40, duration = 0.8, delay = 0, ease = 'power3.out', scrollTrigger: useScroll = true } = options || {};

    gsap.set(el, { opacity: 0, y });

    if (useScroll) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    } else {
      gsap.to(el, { opacity: 1, y: 0, duration, delay, ease });
    }

    return () => {
      gsap.killTweensOf(el);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return ref;
}

// Stagger children reveal
export function useGsapStagger(options?: {
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { y = 50, duration = 0.7, stagger = 0.12, ease = 'power3.out' } = options || {};
    const children = el.children;

    if (!children.length) return;

    gsap.set(children, { opacity: 0, y });

    gsap.to(children, {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });

    return () => {
      gsap.killTweensOf(children);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return ref;
}

// Animated counter
export function useGsapCounter(target: number, options?: {
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { duration = 1.5, delay = 0 } = options || {};
    const obj = { value: 0 };

    gsap.to(obj, {
      value: target,
      duration,
      delay,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        once: true,
      },
      onUpdate: () => {
        el.textContent = Math.round(obj.value).toString();
      },
    });

    return () => {
      gsap.killTweensOf(obj);
    };
  }, [target]);

  return ref;
}

// Score ring animation
export function useGsapScoreRing(score: number, size: number = 140) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const circle = el.querySelector('.score-ring-circle') as SVGCircleElement;
    const text = el.querySelector('.score-ring-text') as SVGTextElement;

    if (!circle || !text) return;

    const offset = circumference - (score / 100) * circumference;

    gsap.set(circle, { strokeDashoffset: circumference });
    gsap.to(circle, {
      strokeDashoffset: offset,
      duration: 1.5,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });

    const obj = { value: 0 };
    gsap.to(obj, {
      value: score,
      duration: 1.5,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        text.textContent = Math.round(obj.value).toString();
      },
    });

    return () => {
      gsap.killTweensOf([circle, obj]);
    };
  }, [score, size]);

  return ref;
}

// Progress bar fill animation
export function useGsapProgressFill(targetPercent: number) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { width: '0%' });
    gsap.to(el, {
      width: `${targetPercent}%`,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        once: true,
      },
    });

    return () => {
      gsap.killTweensOf(el);
    };
  }, [targetPercent]);

  return ref;
}

// Parallax on scroll
export function useGsapParallax(speed: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    return () => {
      gsap.killTweensOf(el);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [speed]);

  return ref;
}

// Text reveal (clip path)
export function useGsapTextReveal(options?: { duration?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { duration = 1, delay = 0 } = options || {};

    gsap.set(el, { clipPath: 'inset(0 100% 0 0)' });
    gsap.to(el, {
      clipPath: 'inset(0 0% 0 0)',
      duration,
      delay,
      ease: 'power3.inOut',
    });

    return () => {
      gsap.killTweensOf(el);
    };
  }, []);

  return ref;
}

// Magnetic hover effect
export function useGsapMagnetic(strength: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

// Batch reveal for multiple elements
export function useGsapBatch(selector: string, options?: {
  y?: number;
  duration?: number;
  stagger?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(selector);
    if (!elements.length) return;

    const { y = 40, duration = 0.6, stagger = 0.1 } = options || {};

    gsap.set(elements, { opacity: 0, y });

    ScrollTrigger.batch(elements, {
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'power3.out',
          overwrite: true,
        });
      },
      start: 'top 88%',
      once: true,
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [selector]);

  return containerRef;
}
