import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withTagline?: boolean;
  linkToHome?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', withTagline = false, linkToHome = true }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const textClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';

  const content = (
    <div className="flex items-center gap-2.5 group">
      {/* Infinity-Inspired Oversight Loop */}
      <div className={`relative ${iconSize} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="#0A1128" />
          <path
            d="M30 38C23.37 38 18 43.37 18 50C18 56.63 23.37 62 30 62C38 62 45 42 50 42C55 42 62 62 70 62C76.63 62 82 56.63 82 50C82 43.37 76.63 38 70 38C62 38 55 58 50 58C45 58 38 38 30 38Z"
            stroke="url(#logoGrad)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="4.5" fill="#06B6D4" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight text-slate-900 ${textClass}`}>
            SYN<span className="text-cyan-600">ORA</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-800">
            AICTE
          </span>
        </div>
        {withTagline && (
          <span className="text-xs text-slate-500 font-medium tracking-tight">
            Intelligent Oversight. Transparent Resolution.
          </span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
