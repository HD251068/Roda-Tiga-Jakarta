import dynamic from "next/dynamic"
export const dynamic = 'force-dynamic'
const DriverDashboard = dynamic(
  () => import("@/components/driver/DriverDashboard"),
  { ssr: false }
)
export default function DriverPage() {
  return <DriverDashboard />
}
