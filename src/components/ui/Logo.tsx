import React from 'react'

export function Logo({ className = "w-6 h-6", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="20" y="20" width="40" height="40" rx="8" stroke={fill} strokeWidth="10" />
      <rect x="40" y="40" width="40" height="40" rx="8" stroke={fill} strokeWidth="10" />
    </svg>
  )
}
