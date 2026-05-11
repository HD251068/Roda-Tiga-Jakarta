// src/components/driver/DriverDashboard.jsx

'use client'

import { useState, useEffect, useRef, useCallback } from "react"

// ─── Constants ───────────────────────────────────────────────────────────────
const MAPBOX_TOKEN = "pk.eyJ1Ijoicm9kYXRpZ2FqYWthcnRhIiwiYSI6ImNtb2kzajdxMTAycnYycnBuaXJ2ZnBkbjIifQ.BRtYhcrtisAEZWWyM0ShlA"
const BASE_FARES = { short: 15000, medium: 25000, far: 50000 }
const GOJEK_FARES = { short: 18000, medium: 28000, far: 55000 }
const MAX_SURGE_VS_GOJEK = 1.2
const PEAK_HOURS = [
  { label: "Pagi", start: 7, end: 9 },
  { label: "Siang", start: 11, end: 13 },
  { label: "Sore", start: 16, end: 19 },
  { label: "Malam Minggu", start: 20, end: 23, weekendOnly: true },
]
const JAKARTA_CENTER = { lng: 106.8272, lat: -6.1751 }

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  ash:     "#F5F0EB",
  ash2:    "#EDE6DC",
  ash3:    "#DDD3C4",
  ash4:    "#BFB3A3",
  ash6:    "#5C5248",
  ink:     "#2C2420",
  ink2:    "#6B5D54",
  ink3:    "#9C8E85",
  ore:     "#C4622D",
  oreD:    "#8F4420",
  oreBg:   "#F7ECE4",
  oreBg2:  "#F0DDD0",
  warn:    "#D4891A",
  warnBg:  "#FBF3E3",
  good:    "#4A7C59",
  goodBg:  "#EAF3EE",
  surface: "#FFFCF9",
  card:    "#FFFFFF",
  border:  "#E8DDD4",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isPeakHour() {
  const h = new Date().getHours()
  const isWeekend = [0, 6].includes(new Date().getDay())
  return PEAK_HOURS.some(p => {
    if (p.weekendOnly && !isWeekend) return false
    return h >= p.start && h < p.end
  })
}
function getCurrentPeakLabel() {
  const h = new Date().getHours()
  const isWeekend = [0, 6].includes(new Date().getDay())
  return PEAK_HOURS.find(p => {
    if (p.weekendOnly && !isWeekend) return false
    return h >= p.start && h < p.end
  })?.label ?? null
}
function calcSurgeMultiplier(demandLevel) {
  let surge = 1 + (demandLevel * 0.4)
  if (isPeakHour()) surge *= 1.15
  return Math.min(surge, 1.35)
}
function calcFare(distKm, surgeMultiplier) {
  let base, gojekRef
  if (distKm <= 4) { base = BASE_FARES.short; gojekRef = GOJEK_FARES.short }
  else if (distKm <= 8) { base = BASE_FARES.medium; gojekRef = GOJEK_FARES.medium }
  else { base = BASE_FARES.far; gojekRef = GOJEK_FARES.far }
  return Math.max(15000, Math.min(Math.round(base * surgeMultiplier / 1000) * 1000, gojekRef * MAX_SURGE_VS_GOJEK))
}
function calcBidPriority(cancelRate, rating, acceptRate) {
  return Math.min(100, Math.round(Math.max(0, 100 - cancelRate * 5) * 0.5 + ((rating - 1) / 4) * 30 + acceptRate * 20))
}
function genNearbyOrders(lat, lng) {
  const names = ["Budi S.", "Siti R.", "Ahmad F.", "Rina K.", "Doni P.", "Wulan T."]
  const destinations = ["Blok M", "Sudirman", "Kemayoran", "Tanah Abang", "Senen", "Monas"]
  const dist = 0.5 + Math.random() * 3
  const angle = Math.random() * 2 * Math.PI
  const tripDist = 2 + Math.random() * 8
  const surge = calcSurgeMultiplier(0.3 + Math.random() * 0.5)
  const fare = calcFare(tripDist, surge)
  return {
    id: `ORD-${Date.now()}`,
    passengerName: names[Math.floor(Math.random() * names.length)],
    pickupLat: lat + (dist / 111) * Math.cos(angle),
    pickupLng: lng + (dist / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle),
    destName: destinations[Math.floor(Math.random() * destinations.length)],
    distToPickup: dist.toFixed(1),
    tripDist: tripDist.toFixed(1),
    etaMins: Math.round((dist / 25) * 60),
    fare, surge: surge.toFixed(2),
    tip: [0, 2000, 5000, 10000][Math.floor(Math.random() * 4)],
  }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Sora:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}

.driver-marker{position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.bajaj-dot{position:relative;z-index:2}
.pulse-ring{position:absolute;inset:-8px;border-radius:50%;border:2px solid #C4622D;opacity:0.6;animation:pulse-anim 2s ease-out infinite}
@keyframes pulse-anim{0%{transform:scale(.8);opacity:.6}100%{transform:scale(1.8);opacity:0}}

.glass-card{background:rgba(255,252,249,0.93);border:1px solid rgba(232,221,212,0.7);border-radius:14px;backdrop-filter:blur(18px) saturate(1.2)}

.btn-primary{background:#C4622D;color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:background .15s,transform .1s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-primary:hover{background:#8F4420}
.btn-primary:active{transform:scale(.97)}
.btn-ghost{background:#EDE6DC;border:1px solid #E8DDD4;border-radius:10px;color:#6B5D54;padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;transition:background .15s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-ghost:hover{background:#DDD3C4}
.btn-danger{background:#FAE8E8;border:1px solid rgba(163,45,45,.2);border-radius:10px;color:#A32D2D;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}

.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.pill-green{background:#EAF3EE;color:#4A7C59}
.pill-amber{background:#FBF3E3;color:#D4891A}
.pill-red{background:#FAE8E8;color:#A32D2D}
.pill-blue{background:#F7ECE4;color:#8F4420}
.pill-gray{background:#EDE6DC;color:#5C5248}

.toggle-track{width:46px;height:24px;border-radius:12px;background:#DDD3C4;border:1px solid #BFB3A3;position:relative;cursor:pointer;transition:background .3s,border-color .3s;flex-shrink:0}
.toggle-track.on{background:#C4622D;border-color:#8F4420}
.toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:9px;background:#fff;transition:transform .3s;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.toggle-track.on .toggle-thumb{transform:translateX(22px)}

.stat-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #E8DDD4}
.stat-row:last-child{border-bottom:none}
.stat-label{font-size:12px;color:#9C8E85}
.stat-value{font-size:13px;font-weight:600;color:#2C2420}

.order-modal-bg{position:fixed;inset:0;background:rgba(44,36,32,.72);z-index:999;display:flex;align-items:flex-end;justify-content:center;padding:0 12px 20px;animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.order-modal{width:100%;max-width:430px;background:#FFFCF9;border:1px solid #E8DDD4;border-radius:20px 20px 14px 14px;padding:18px;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}

.progress-bar{height:3px;background:#EDE6DC;border-radius:2px;overflow:hidden}
.progress-fill{height:100%;border-radius:2px;transition:width 1s linear;background:#C4622D}

.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(255,252,249,.97);border-top:1px solid #E8DDD4;display:flex;align-items:center;justify-content:space-around;padding:10px 0 18px;z-index:100;backdrop-filter:blur(20px)}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 14px}
.nav-icon{font-size:20px;opacity:.25;transition:opacity .2s}
.nav-label{font-size:10px;color:#9C8E85;font-weight:500}
.nav-item.active .nav-icon{opacity:1}
.nav-item.active .nav-label{color:#C4622D}

.info-box{background:#F7ECE4;border:1px solid rgba(196,98,45,.2);border-radius:10px;padding:12px 14px;font-size:12px;color:#8F4420;line-height:1.7}
.warn-box{background:#FBF3E3;border:1px solid rgba(212,137,26,.2);border-radius:10px;padding:12px 14px;font-size:12px;color:#7A5010;line-height:1.7}
`

// ─── Component ────────────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const orderMarkersRef = useRef([])

  const [isOnline, setIsOnline] = useState(false)
  const [autoBid, setAutoBid] = useState(false)
  const [driverPos, setDriverPos] = useState({ lat: JAKARTA_CENTER.lat, lng: JAKARTA_CENTER.lng })
  const [battery] = useState(78)
  const [cancelRate] = useState(8)
  const [rating] = useState(4.7)
  const [acceptRate] = useState(0.82)

  const [activeOrder, setActiveOrder] = useState(null)
  const [incomingOrder, setIncomingOrder] = useState(null)
  const [orderTimer, setOrderTimer] = useState(15)
  const [todayEarnings, setTodayEarnings] = useState({ fare: 87000, tip: 15000, trips: 6 })
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completedRide, setCompletedRide] = useState(null)

  const [peakHour, setPeakHour] = useState(isPeakHour())
  const [peakLabel] = useState(getCurrentPeakLabel())
  const [activeTab, setActiveTab] = useState("home")
  const [showBidInfo, setShowBidInfo] = useState(false)

  const bidPriority = calcBidPriority(cancelRate, rating, acceptRate)
  const radiusMax = peakHour ? 15 : 10
  const priorityColor = bidPriority >= 80 ? T.good : bidPriority >= 55 ? T.warn : "#A32D2D"
  const priorityLabel = bidPriority >= 80 ? "Prioritas tinggi" : bidPriority >= 55 ? "Prioritas sedang" : "Prioritas rendah"

  useEffect(() => {
    if (mapInstanceRef.current) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
    document.head.appendChild(link)
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"
    script.onload = initMap
    document.head.appendChild(script)
  }, [])

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return
    const mapboxgl = window.mapboxgl
    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [JAKARTA_CENTER.lng, JAKARTA_CENTER.lat],
      zoom: 14, attributionControl: false,
    })
    map.on("load", () => {
      mapInstanceRef.current = map
      const pts = 64, coords = []
      const r = 2.5
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * 2 * Math.PI
        coords.push([JAKARTA_CENTER.lng + (r / (111 * Math.cos(JAKARTA_CENTER.lat * Math.PI / 180))) * Math.sin(a), JAKARTA_CENTER.lat + (r / 111) * Math.cos(a)])
      }
      coords.push(coords[0])
      map.addSource("radius", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] } } })
      map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": T.ore, "fill-opacity": 0.06 } })
      map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": T.ore, "line-width": 1.5, "line-dasharray": [5, 4] } })

      const el = document.createElement("div")
      el.className = "driver-marker"
      el.innerHTML = `<div class="pulse-ring"></div><div class="bajaj-dot"><svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#C4622D" stroke="#fff" stroke-width="3"/><text x="22" y="29" font-size="18" text-anchor="middle">🛺</text></svg></div>`
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([JAKARTA_CENTER.lng, JAKARTA_CENTER.lat]).addTo(map)
    })
  }

  useEffect(() => {
    if (!isOnline || !mapInstanceRef.current) return
    const interval = setInterval(() => {
      setDriverPos(prev => {
        const newLat = prev.lat + (Math.random() - 0.5) * 0.001
        const newLng = prev.lng + (Math.random() - 0.5) * 0.001
        markerRef.current?.setLngLat([newLng, newLat])
        return { lat: newLat, lng: newLng }
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [isOnline])

  useEffect(() => {
    if (!isOnline || activeOrder) return
    const interval = setInterval(() => {
      if (!incomingOrder) {
        const order = genNearbyOrders(driverPos.lat, driverPos.lng)
        if (order.etaMins > radiusMax) return
        if (autoBid && bidPriority >= 60) { setTimeout(() => acceptOrder(order), 800); return }
        setIncomingOrder(order); setOrderTimer(15)
      }
    }, 9000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [isOnline, autoBid, incomingOrder, activeOrder, bidPriority, radiusMax])

  useEffect(() => {
    if (!incomingOrder) return
    if (orderTimer <= 0) { setIncomingOrder(null); return }
    const t = setTimeout(() => setOrderTimer(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [incomingOrder, orderTimer])

  const acceptOrder = useCallback((order) => {
    setActiveOrder(order); setIncomingOrder(null)
    if (mapInstanceRef.current) {
      orderMarkersRef.current.forEach(m => m.remove())
      const el = document.createElement("div")
      el.innerHTML = `<div style="background:#C4622D;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.2)">📍 Jemput</div>`
      orderMarkersRef.current = [new window.mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([order.pickupLng, order.pickupLat]).addTo(mapInstanceRef.current)]
      mapInstanceRef.current.flyTo({ center: [order.pickupLng, order.pickupLat], zoom: 15 })
    }
  }, [])

  const completeOrder = () => {
    if (!activeOrder) return
    setTodayEarnings(prev => ({ fare: prev.fare + activeOrder.fare, tip: prev.tip + activeOrder.tip, trips: prev.trips + 1 }))
    setCompletedRide(activeOrder); setActiveOrder(null); setShowCompleteModal(true)
    orderMarkersRef.current.forEach(m => m.remove()); orderMarkersRef.current = []
  }

  const toggleOnline = () => {
    const next = !isOnline; setIsOnline(next)
    if (!next) { setAutoBid(false); setIncomingOrder(null) }
  }

  const cardStyle = { background: "rgba(255,252,249,0.93)", border: `1px solid rgba(232,221,212,0.7)`, borderRadius: 14, backdropFilter: "blur(18px) saturate(1.2)" }
  const ff = "'Plus Jakarta Sans', sans-serif"
  const ff2 = "'Sora', sans-serif"

  return (
    <div style={{ fontFamily: ff, background: T.ash, minHeight: "100vh", color: T.ink, position: "relative", maxWidth: 430, margin: "0 auto" }}>
      <style>{CSS}</style>

      {/* Map */}
      <div ref={mapRef} style={{ position: "fixed", inset: 0, top: 0, maxWidth: 430, left: "50%", transform: "translateX(-50%)", zIndex: 0 }} />

      {/* Offline CTA */}
      {activeTab === "home" && !isOnline && (
        <div style={{ position: "fixed", inset: 0, maxWidth: 430, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 14px 76px" }}>
          <div style={{ ...cardStyle, width: "100%", padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🛺</div>
            <div style={{ fontFamily: ff2, fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Kamu sedang offline</div>
            <div style={{ fontSize: 12, color: T.ink3, marginBottom: 14 }}>Aktifkan untuk mulai terima order</div>
            <button className="btn-primary" onClick={toggleOnline}>Mulai online</button>
          </div>
        </div>
      )}

      {/* Home HUD */}
      {activeTab === "home" && isOnline && (
        <>
          <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 10, padding: "44px 14px 0" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ ...cardStyle, flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.good }} />
                  <span style={{ fontFamily: ff2, fontSize: 12, fontWeight: 600, color: T.ink2, letterSpacing: "0.04em" }}>ONLINE</span>
                </div>
                <div className={`toggle-track on`} onClick={toggleOnline}><div className="toggle-thumb" /></div>
              </div>
              <div style={{ ...cardStyle, padding: "10px 13px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: T.good }}>🔋</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{battery}%</span>
              </div>
            </div>
            {peakHour && (
              <div className="warn-box" style={{ marginBottom: 8 }}>
                ⚡ <strong>Peak hour {peakLabel}</strong> — Radius diperluas s/d {radiusMax} mnt · Surge aktif
              </div>
            )}
            <div style={{ ...cardStyle, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: T.ink3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Hari ini</div>
                <div style={{ fontFamily: ff2, fontSize: 19, fontWeight: 700, color: T.ink }}>Rp {(todayEarnings.fare + todayEarnings.tip).toLocaleString("id-ID")}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="pill pill-gray">{todayEarnings.trips} trip</span>
                {todayEarnings.tip > 0 && <span className="pill pill-amber">+Rp {todayEarnings.tip.toLocaleString("id-ID")}</span>}
              </div>
            </div>
          </div>

          <div style={{ position: "fixed", bottom: 68, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 10, padding: "0 14px" }}>
            {activeOrder ? (
              <div style={{ ...cardStyle, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.ore, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>● Perjalanan aktif</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{activeOrder.passengerName}</div>
                    <div style={{ fontSize: 12, color: T.ink3 }}>→ {activeOrder.destName} · {activeOrder.tripDist} km</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: ff2, fontSize: 20, fontWeight: 700, color: T.ore }}>Rp {activeOrder.fare.toLocaleString("id-ID")}</div>
                    {activeOrder.tip > 0 && <div style={{ fontSize: 11, color: T.warn }}>+Tip Rp {activeOrder.tip.toLocaleString("id-ID")}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }}>📞 Telepon</button>
                  <button className="btn-primary" style={{ flex: 2 }} onClick={completeOrder}>🏁 Selesai</button>
                </div>
              </div>
            ) : (
              <div style={{ ...cardStyle, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Auto-bid</div>
                    <div style={{ fontSize: 11, color: T.ink3 }}>Terima order otomatis</div>
                  </div>
                  <div className={`toggle-track ${autoBid ? "on" : ""}`} onClick={() => setAutoBid(p => !p)}><div className="toggle-thumb" /></div>
                </div>
                <div style={{ background: T.ash, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontFamily: ff2, fontSize: 28, fontWeight: 700, color: priorityColor }}>{bidPriority}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: priorityColor, marginBottom: 2 }}>{priorityLabel}</div>
                    <div style={{ fontSize: 10, color: T.ink3 }}>Cancel {cancelRate}% · Rating {rating} · Accept {Math.round(acceptRate * 100)}%</div>
                  </div>
                </div>
                {showBidInfo && (
                  <div className="info-box" style={{ marginTop: 10 }}>
                    Cancel rate rendah = prioritas lebih tinggi = order lebih sering masuk.<br />
                    Skor &gt;80 mendapat prioritas tertinggi dalam auto-bid.
                  </div>
                )}
                <button onClick={() => setShowBidInfo(p => !p)} style={{ background: "none", border: "none", fontSize: 11, color: T.ink3, cursor: "pointer", marginTop: 8 }}>
                  {showBidInfo ? "Sembunyikan" : "ℹ️ Cara kerja auto-bid"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Earnings tab */}
      {activeTab === "earnings" && (
        <div style={{ position: "fixed", inset: 0, top: 0, maxWidth: 430, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: T.ash, overflowY: "auto", padding: "52px 14px 90px" }}>
          <div style={{ fontSize: 10, color: T.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Penghasilan</div>
          <div style={{ fontFamily: ff2, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 18 }}>Laporan harian</div>
          <div style={{ background: T.ore, borderRadius: 20, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total hari ini</div>
            <div style={{ fontFamily: ff2, fontSize: 30, fontWeight: 700, color: "#fff" }}>Rp {(todayEarnings.fare + todayEarnings.tip).toLocaleString("id-ID")}</div>
            <div style={{ display: "flex", gap: 20, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.2)" }}>
              {[["Tarif", todayEarnings.fare], ["Tip", todayEarnings.tip], ["Trip", `${todayEarnings.trips}×`]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{l}</div><div style={{ fontFamily: ff2, fontSize: 16, fontWeight: 600, color: "#fff" }}>{typeof v === "number" ? `Rp ${v.toLocaleString("id-ID")}` : v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>Dynamic pricing</div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
            {[["Tarif minimal / trip", "Rp 15.000"], ["Batas maks vs Gojek", "+20%"], ["Surge maks", "×1.35"], ["≤4 km normal", "Rp 15.000"], ["≤4 km peak hour", "Rp 17.000 ⚡"]].map(([l, v]) => (
              <div key={l} className="stat-row"><span className="stat-label">{l}</span><span className="stat-value">{v}</span></div>
            ))}
          </div>
          <div className="warn-box"><strong>Peak hours:</strong> 07–09 · 11–13 · 16–19 · 20–23 Sabtu-Minggu.<br />Radius layanan meluas s/d 15 menit saat peak.</div>
        </div>
      )}

      {/* Battery tab */}
      {activeTab === "battery" && (
        <div style={{ position: "fixed", inset: 0, top: 0, maxWidth: 430, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: T.ash, overflowY: "auto", padding: "52px 14px 90px" }}>
          <div style={{ fontSize: 10, color: T.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Kendaraan</div>
          <div style={{ fontFamily: ff2, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 18 }}>Baterai & charging</div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div style={{ fontSize: 11, color: T.ink3, marginBottom: 4 }}>Level baterai</div><div style={{ fontFamily: ff2, fontSize: 36, fontWeight: 700, color: T.good }}>{battery}%</div></div>
              <div style={{ textAlign: "right", fontSize: 12, color: T.ink3 }}><div style={{ color: T.good, fontWeight: 600 }}>~{Math.round(battery * 0.8)} km tersisa</div><div style={{ marginTop: 3 }}>Baterai baik</div></div>
            </div>
            <div style={{ height: 6, background: T.ash2, borderRadius: 3, overflow: "hidden", marginTop: 12 }}>
              <div style={{ height: "100%", width: `${battery}%`, background: T.good, borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>Stasiun terdekat</div>
          {[["SPKLU Dukuh Atas", "1.2 km", "5 mnt", 3, 6], ["SPKLU Blok M", "2.8 km", "11 mnt", 1, 4], ["SPKLU Semanggi", "3.4 km", "13 mnt", 0, 4]].map(([n, d, e, s, t]) => (
            <div key={n} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{n}</div><div style={{ fontSize: 11, color: T.ink3 }}>{d} · ETA {e}</div></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span className={`pill ${s > 1 ? "pill-green" : s > 0 ? "pill-amber" : "pill-red"}`}>{s}/{t} slot</span>
                {s > 0 && <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 12, width: "auto" }}>Pesan</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === "settings" && (
        <div style={{ position: "fixed", inset: 0, top: 0, maxWidth: 430, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: T.ash, overflowY: "auto", padding: "52px 14px 90px" }}>
          <div style={{ fontSize: 10, color: T.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Profil</div>
          <div style={{ fontFamily: ff2, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 18 }}>Performa saya</div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: T.oreBg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛺</div>
            <div>
              <div style={{ fontFamily: ff2, fontSize: 16, fontWeight: 700, color: T.ink }}>Ahmad Ridho</div>
              <div style={{ fontSize: 12, color: T.ink3, marginBottom: 6 }}>Bajaj Listrik · B 1234 KJT</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="pill pill-gray">⭐ {rating}</span>
                <span className="pill pill-green">{priorityLabel}</span>
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
            {[["Skor bid", `${bidPriority}/100`, T.good], ["Cancel rate", `${cancelRate}%`, T.warn], ["Accept rate", `${Math.round(acceptRate * 100)}%`, T.ink], ["Rating", `⭐ ${rating}`, T.ink]].map(([l, v, c]) => (
              <div key={l} className="stat-row"><span className="stat-label">{l}</span><span className="stat-value" style={{ color: c }}>{v}</span></div>
            ))}
          </div>
          <div className="info-box"><strong>Cara naik prioritas:</strong><br />· Cancel rate &lt;5% → skor 80+ → prioritas tertinggi<br />· Jawab order dalam 15 detik<br />· Pertahankan rating di atas 4.5</div>
        </div>
      )}

      {/* Incoming Order Modal */}
      {incomingOrder && (
        <div className="order-modal-bg">
          <div className="order-modal">
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.oreBg2, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔔</div>
              <div style={{ fontFamily: ff2, fontSize: 18, fontWeight: 700, color: T.ink }}>Order masuk</div>
              <div style={{ fontSize: 12, color: T.ink3 }}>dalam radius {incomingOrder.etaMins} menit</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: T.ink3 }}>Batas waktu</span>
              <span style={{ fontWeight: 700, color: orderTimer <= 5 ? "#A32D2D" : T.ink }}>{orderTimer}s</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 12 }}>
              <div className="progress-fill" style={{ width: `${(orderTimer / 15) * 100}%`, background: orderTimer <= 5 ? "#A32D2D" : T.ore }} />
            </div>
            <div style={{ background: T.ash, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div><div style={{ fontSize: 11, color: T.ink3 }}>Penumpang</div><div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{incomingOrder.passengerName}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: T.ink3 }}>Jemput</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{incomingOrder.distToPickup} km · {incomingOrder.etaMins} mnt</div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div><div style={{ fontSize: 11, color: T.ink3 }}>Tujuan</div><div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>→ {incomingOrder.destName} ({incomingOrder.tripDist} km)</div></div>
                <div style={{ textAlign: "right" }}>
                  {parseFloat(incomingOrder.surge) > 1.05 && <div style={{ fontSize: 10, color: T.warn, fontWeight: 600, marginBottom: 2 }}>⚡ ×{parseFloat(incomingOrder.surge).toFixed(2)}</div>}
                  <div style={{ fontFamily: ff2, fontSize: 22, fontWeight: 700, color: T.ore }}>Rp {incomingOrder.fare.toLocaleString("id-ID")}</div>
                  {incomingOrder.tip > 0 && <div style={{ fontSize: 11, color: T.warn }}>+Tip Rp {incomingOrder.tip.toLocaleString("id-ID")}</div>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => setIncomingOrder(null)}>✕ Tolak</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={() => acceptOrder(incomingOrder)}>✓ Terima order</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && completedRide && (
        <div className="order-modal-bg">
          <div className="order-modal" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontFamily: ff2, fontSize: 20, fontWeight: 700, color: T.good, marginBottom: 16 }}>Perjalanan selesai!</div>
            <div style={{ background: T.ash, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 14, textAlign: "left" }}>
              <div className="stat-row"><span className="stat-label">Tarif dasar</span><span className="stat-value">Rp {completedRide.fare.toLocaleString("id-ID")}</span></div>
              <div className="stat-row"><span className="stat-label">Tip penumpang</span><span className="stat-value" style={{ color: T.warn }}>+Rp {completedRide.tip.toLocaleString("id-ID")}</span></div>
              <div className="stat-row"><span className="stat-label" style={{ fontWeight: 600, color: T.ink }}>Total diterima</span><span style={{ fontFamily: ff2, fontSize: 18, fontWeight: 700, color: T.ore }}>Rp {(completedRide.fare + completedRide.tip).toLocaleString("id-ID")}</span></div>
            </div>
            <button className="btn-primary" onClick={() => { setShowCompleteModal(false); setCompletedRide(null) }}>Siap order lagi</button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="nav-bar">
        {[
          { id: "home", icon: "🗺️", label: "Peta" },
          { id: "earnings", icon: "💰", label: "Penghasilan" },
          { id: "battery", icon: "🔋", label: "Charging" },
          { id: "settings", icon: "👤", label: "Profil" },
        ].map(n => (
          <div key={n.id} className={`nav-item ${activeTab === n.id ? "active" : ""}`} onClick={() => setActiveTab(n.id)}>
            <div className="nav-icon">{n.icon}</div>
            <div className="nav-label">{n.label}</div>
          </div>
        ))}
      </nav>
    </div>
  )
}
