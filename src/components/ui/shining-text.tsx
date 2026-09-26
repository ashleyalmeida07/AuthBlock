"use client" 

import * as React from "react"

import { motion } from "motion/react";
 
export function ShiningText({text, className = ""}: {text: React.ReactNode, className?: string}) {
  return (
    <motion.span
      className={`bg-[linear-gradient(110deg,#2563EB,35%,#93C5FD,50%,#2563EB,75%,#2563EB)] bg-[length:200%_100%] bg-clip-text text-transparent ${className}`}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 5, // Made slower as requested
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
}
