'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  originalRadius: number;
}

interface HeroNetworkCanvasProps {
  className?: string;
  particleCount?: number;
}

export function HeroNetworkCanvas({
  className = '',
  particleCount = 55,
}: HeroNetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 120,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const colors = [
      '#FF6B00', // Campus Flame Orange
      '#FF6B00',
      '#F59E0B', // Amber Gold
      '#EAB308', // Warm Golden Yellow
      '#0F172A', // Dark Slate
      '#1E293B', // Charcoal Slate
      '#334155', // Slate
      '#64748B', // Soft Slate
    ];

    const particles: Particle[] = [];
    const count = Math.min(particleCount, Math.floor((width * height) / 3800));

    // Spawn organic nodes
    for (let i = 0; i < count; i++) {
      const radius = Math.random() < 0.15 ? Math.random() * 6 + 7 : Math.random() * 3 + 2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius,
        originalRadius: radius,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // High-DPI Support
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const maxDistance = 110;
      const mouse = mouseRef.current;

      // Draw connecting proximity lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100, 116, 139, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Boundary bouncing with dampening
          if (p.x - p.radius < 0) {
            p.x = p.radius;
            p.vx *= -1;
          } else if (p.x + p.radius > width) {
            p.x = width - p.radius;
            p.vx *= -1;
          }

          if (p.y - p.radius < 0) {
            p.y = p.radius;
            p.vy *= -1;
          } else if (p.y + p.radius > height) {
            p.y = height - p.radius;
            p.vy *= -1;
          }

          // Mouse gravity interaction
          if (mouse.x !== null && mouse.y !== null) {
            const mdx = mouse.x - p.x;
            const mdy = mouse.y - p.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (mdist < mouse.radius && mdist > 0) {
              const force = (1 - mdist / mouse.radius) * 0.4;
              p.x -= (mdx / mdist) * force * 4;
              p.y -= (mdy / mdist) * force * 4;
            }
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius > 6 ? 6 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      const previouslyVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !previouslyVisible) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      }
    }, { threshold: 0.05 });

    observer.observe(canvas);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-auto select-none ${className}`}
      aria-hidden="true"
    />
  );
}
