import dynamicImport from "next/dynamic"
export const dynamic = 'force-dynamic'
const DriverDashboard = dynamicImport(
  () => import("@/components/driver/DriverDashboard"),
  { ssr: false }
)
export default function DriverPage() {
  return <DriverDashboard />
}
