// src/app/driver/page.tsx
'use client'

import dynamic from "next/dynamic"

const DriverDashboard = dynamic(
  () => import("@/components/driver/DriverDashboard"),
  { ssr: false }
)

export default function DriverPage() {
  return <DriverDashboard />
}
