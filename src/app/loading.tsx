import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
        {/* Inner pulsing center */}
        <div className="w-6 h-6 rounded-full bg-indigo-600/10 animate-pulse" />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest mt-2 animate-pulse">
        Loading Portal...
      </span>
    </div>
  );
}
