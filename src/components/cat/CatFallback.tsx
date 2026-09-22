"use client";

import { Component, type ReactNode } from "react";

/**
 * Accessible, dependency-free fallback.
 * The website is fully usable without WebGL — this keeps the companion's
 * personality (and a graceful loading/error state) when 3D is unavailable.
 */
export function CatFallback({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full w-full items-end justify-center ${className}`}
      role="img"
      aria-label={label ?? "Illustration of a Persian cat"}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-[0_10px_20px_rgba(16,42,67,0.18)]">
        <ellipse cx="100" cy="182" rx="52" ry="8" fill="#102A43" opacity="0.12" />
        {/* tail */}
        <path
          d="M143 158c22-4 33-19 30-36-2-13-13-19-22-15-8 4-9 14-3 19 5 4 12 1 13-6"
          fill="none"
          stroke="#F3EBDC"
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* body */}
        <path
          d="M64 176c-8-27-4-56 12-72 9-9 21-14 33-14 13 0 25 5 34 14 16 17 20 45 12 72H64Z"
          fill="#F3EBDC"
        />
        {/* chest ruff */}
        <path d="M84 128c10 8 22 12 34 12s24-4 34-12c-2 24-14 44-34 48-20-4-32-24-34-48Z" fill="#EADFCB" />
        {/* head */}
        <ellipse cx="110" cy="86" rx="47" ry="43" fill="#F3EBDC" />
        {/* ears */}
        <path d="M70 60 62 26c-1-5 3-8 7-5l25 19-24 20Z" fill="#F3EBDC" />
        <path d="M150 60l8-34c1-5-3-8-7-5l-25 19 24 20Z" fill="#F3EBDC" />
        <path d="M74 55 70 36c-.6-3 1.6-4.4 3.7-2.9l14.3 10.6L74 55Z" fill="#D9A69F" />
        <path d="M146 55l4-19c.6-3-1.6-4.4-3.7-2.9L132 33.7 146 55Z" fill="#D9A69F" />
        {/* cheek fluff */}
        <ellipse cx="76" cy="98" rx="20" ry="17" fill="#EADFCB" />
        <ellipse cx="144" cy="98" rx="20" ry="17" fill="#EADFCB" />
        {/* eyes */}
        <ellipse cx="92" cy="84" rx="12" ry="11.5" fill="#C98A2E" />
        <ellipse cx="128" cy="84" rx="12" ry="11.5" fill="#C98A2E" />
        <ellipse cx="92" cy="84" rx="4.4" ry="9" fill="#14161A" />
        <ellipse cx="128" cy="84" rx="4.4" ry="9" fill="#14161A" />
        <circle cx="96" cy="80" r="2.6" fill="#fff" />
        <circle cx="132" cy="80" r="2.6" fill="#fff" />
        {/* nose + mouth */}
        <path d="M110 96c-4 0-6 2-6 4s3 5 6 5 6-2 6-5-2-4-6-4Z" fill="#B87C74" />
        <path d="M110 105v5m0 0c-3 4-9 4-12 0m12 0c3 4 9 4 12 0" stroke="#B87C74" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* whiskers */}
        <g stroke="#B6A995" strokeWidth="2" strokeLinecap="round" opacity="0.9">
          <path d="M84 98 54 92M84 104l-30 6M136 98l30-6M136 104l30 6" />
        </g>
        {/* front paws */}
        <ellipse cx="84" cy="172" rx="15" ry="9" fill="#F3EBDC" />
        <ellipse cx="136" cy="172" rx="15" ry="9" fill="#F3EBDC" />
      </svg>
      {label ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </div>
  );
}

interface BoundaryState {
  failed: boolean;
}

/** Catches WebGL/scene crashes so the site never shows a raw error. */
export class CatErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[cattery] 3D companion unavailable, using the illustrated fallback.", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? <CatFallback />;
    return this.props.children;
  }
}
