// src/app/driver/dashboard/page.tsx

import dynamic from "next/dynamic"

const DriverDashboard = dynamic(
  () => import("@/components/driver/DriverDashboard"),
  { ssr: false }
)

export const metadata = {
  title: "Dashboard Pengemudi | Roda Tiga Jakarta",
  description: "Dashboard utama pengemudi bajaj listrik Roda Tiga Jakarta",
}

export default function DriverDashboardPage() {
  return <DriverDashboard />
}
