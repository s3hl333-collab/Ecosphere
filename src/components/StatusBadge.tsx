import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?:
    | 'green'
    | 'blue'
    | 'yellow'
    | 'red'
    | 'gray'
    | 'purple'
    | 'prototype';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'gray',
  size = 'sm',
  icon,
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/80',
    yellow: 'bg-amber-50 text-amber-800 border-amber-200/80',
    red: 'bg-rose-50 text-rose-800 border-rose-200/80',
    gray: 'bg-zinc-100/80 text-zinc-700 border-zinc-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    prototype: 'bg-zinc-100 text-zinc-700 border-zinc-300 font-mono text-[9px] uppercase tracking-wider',
  };

  const dotColors = {
    green: 'bg-emerald-500',
    blue: 'bg-sky-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    gray: 'bg-zinc-400',
    purple: 'bg-purple-500',
    prototype: 'bg-zinc-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border leading-none shadow-2xs ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {icon ? (
        <span className="shrink-0">{icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />
      )}
      <span>{label}</span>
    </span>
  );
};
