"use client"

import Image from "next/image"
import { CSSProperties } from "react"

interface LockIconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export default function LockIcon({ className = "", style }: LockIconProps) {
  return (
    <Image
      src="/laterlock-icon.png"
      alt="Lock"
      width={128}
      height={128}
      className={className}
      style={{
        verticalAlign: 'middle',
        height: "1em",
        width: "1em",
        ...style
      }}
    />
  )
}
