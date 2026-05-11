// src/app/passenger/page.tsx
import dynamic from "next/dynamic"

const PassengerDashboard = dynamic(
  () => import("@/components/passenger/PassengerDashboard"),
  { ssr: false }
)

export default function PassengerPage() {
  return <PassengerDashboard />
}
