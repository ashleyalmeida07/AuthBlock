'use client'

import React from 'react'

const tickerItems = [
  { name: 'B.Tech CS', count: '3,520', change: '2.98%', up: true },
  { name: 'Higher Secondary', count: '42', change: '0.33%', up: false },
  { name: 'Diploma Eng.', count: '73', change: '0.21%', up: false },
  { name: 'M.Sc Physics', count: '4', change: '0.88%', up: true },
  { name: 'PhD Research', count: '183,238', change: '1.38%', up: true },
  { name: 'MBA Finance', count: '1,250', change: '0.52%', up: true },
]

function TickerItem({ item }: { item: typeof tickerItems[0] }) {
  return (
    <span className="inline-flex items-center gap-2 mx-6 text-sm">
      <span className="text-brand-blue font-semibold">●</span>
      <span className="font-semibold text-brand-navy">{item.name}</span>
      <span className="text-brand-navy font-bold">{item.count}</span>
      <span className={`font-semibold ${item.up ? 'text-emerald-600' : 'text-red-500'}`}>
        {item.up ? '▲' : '▼'} {item.change}
      </span>
      <span className="text-brand-navy/30">—</span>
      <span className="text-brand-navy/60 font-light">Blockchain verified today</span>
      <span className="text-brand-border ml-4">|</span>
    </span>
  )
}

export function TickerBar() {
  return (
    <div className="w-full py-3 border-y border-brand-border bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {/* Duplicate items for seamless loop */}
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <TickerItem key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
