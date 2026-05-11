// src/components/passenger/PassengerDashboard.tsx
// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback } from "react"

const MAPBOX_TOKEN = "pk.eyJ1Ijoicm9kYXRpZ2FqYWthcnRhIiwiYSI6ImNtb2kzajdxMTAycnYycnBuaXJ2ZnBkbjIifQ.BRtYhcrtisAEZWWyM0ShlA"
const JAKARTA_CENTER = { lng: 106.8272, lat: -6.1751 }

const T = {
  forest:"#1A4A42", forestD:"#0D2E28", forestM:"#2D6B5F",
  forestBg:"#E8F4F1", forestBg2:"#F0F7F5",
  terra:"#B5421A", terraD:"#8F3314", terraBg:"#FAEAE4", terraBg2:"#F5D5C8",
  ink:"#0D2420", ink2:"#2A4A45", ink3:"#5A7A76", ink4:"#8AA8A4",
  white:"#FFFFFF", surface:"#F8FFFE", surface2:"#F0F7F5",
  border:"#1A4A42", borderL:"#B8D4CF",
  warn:"#8A5C00", warnBg:"#FFF8E6", warnBdr:"#D4A820",
}

const PEAK_HOURS = [{s:7,e:9},{s:11,e:13},{s:16,e:19}]
const BASE_FARES = [15000,25000,50000]
const GOJEK_FARES = [18000,28000,55000]
const TIPS = [0,2000,5000,10000,20000]

// Kategori POI yang paling mudah ditemukan driver bajaj
const POI_CATEGORIES = "mosque,convenience,bus_stop,school,atm,pharmacy"

// Fallback favorites jika user baru (belum ada riwayat)
const DEFAULT_FAVORITES = [
  { name:"Rumah", ic:"🏠", lat:null, lng:null, isPlaceholder:true },
  { name:"Kantor", ic:"🏢", lat:null, lng:null, isPlaceholder:true },
]

function isPeak(){const h=new Date().getHours();return PEAK_HOURS.some(p=>h>=p.s&&h<p.e)}
function calcFare(km){
  const i=km<=4?0:km<=8?1:2
  const surge=isPeak()?1.15:1
  return Math.max(15000,Math.min(Math.round(BASE_FARES[i]*surge/1000)*1000,GOJEK_FARES[i]*1.2))
}
function calcDist(a,b){
  const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))
}

// Ambil 4 POI terdekat via Mapbox Search Box API
async function fetchNearbyPOI(lat, lng) {
  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/category/${POI_CATEGORIES}?proximity=${lng},${lat}&limit=4&language=id&access_token=${MAPBOX_TOKEN}`
    const r = await fetch(url)
    const d = await r.json()
    return (d.features || []).slice(0, 4).map(f => ({
      name: f.properties.name,
      address: f.properties.full_address?.split(",")[0] || "",
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      category: f.properties.poi_category?.[0] || "place",
      ic: getCategoryIcon(f.properties.poi_category?.[0]),
      isDynamic: true,
    }))
  } catch {
    return []
  }
}

function getCategoryIcon(cat) {
  const map = {
    mosque:"🕌", prayer_room:"🕌", church:"⛪",
    convenience:"🏪", supermarket:"🛒", grocery:"🛒",
    bus_stop:"🚌", train_station:"🚉", transit:"🚌",
    school:"🏫", university:"🎓",
    atm:"🏧", bank:"🏦",
    pharmacy:"💊", hospital:"🏥", clinic:"🏥",
    restaurant:"🍽️", cafe:"☕",
    gas_station:"⛽",
  }
  return map[cat] || "📍"
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.btn-primary{background:#1A4A42;color:#FFFFFF;border:none;border-radius:12px;padding:16px;font-size:15px;font-weight:700;cursor:pointer;width:100%;min-height:52px;transition:background .15s,transform .1s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-primary:hover{background:#0D2E28}
.btn-primary:active{transform:scale(.97)}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.btn-cta{background:#B5421A;color:#FFFFFF;border:none;border-radius:12px;padding:16px;font-size:15px;font-weight:700;cursor:pointer;width:100%;min-height:52px;transition:background .15s,transform .1s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-cta:hover{background:#8F3314}
.btn-cta:active{transform:scale(.97)}
.btn-ghost{background:#FFFFFF;border:2px solid #1A4A42;border-radius:12px;color:#0D2420;padding:14px 16px;font-size:14px;font-weight:600;cursor:pointer;min-height:52px;transition:background .15s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-ghost:hover{background:#E8F4F1}
.card{background:#FFFFFF;border:2px solid #B8D4CF;border-radius:16px}
.input-wrap{background:#FFFFFF;border:2px solid #B8D4CF;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:border-color .15s;min-height:64px}
.input-wrap:hover{border-color:#1A4A42}
.input-wrap.active{border-color:#1A4A42;background:#E8F4F1}
.input-label{font-size:11px;color:#1A4A42;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}
.input-val{font-size:14px;font-weight:700;color:#0D2420;line-height:1.3}
.input-placeholder{font-size:14px;color:#8AA8A4}
.tip-btn{padding:10px 14px;border-radius:10px;border:2px solid #B8D4CF;background:#FFFFFF;font-size:13px;font-weight:600;cursor:pointer;color:#0D2420;transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif;min-height:44px}
.tip-btn.active{background:#F5D5C8;border-color:#B5421A;color:#8F3314}
.sheet-bg{position:fixed;inset:0;background:rgba(13,36,32,.75);z-index:40;display:flex;align-items:flex-end;justify-content:center}
.sheet{width:100%;max-width:430px;background:#FFFFFF;border-radius:20px 20px 0 0;padding:20px;max-height:88vh;overflow-y:auto;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);border-top:3px solid #1A4A42}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.header-bar{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:20;background:#1A4A42;padding:14px 16px 13px;display:flex;align-items:center;gap:12px}
.header-logo{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:20px;border:1.5px solid rgba(255,255,255,.3)}
.header-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;line-height:1.2}
.header-sub{font-size:11px;color:rgba(255,255,255,.8);font-weight:500}
.header-badge{margin-left:auto;background:#B5421A;color:#FFFFFF;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700}
.stat-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1.5px solid #E8F4F1;font-size:14px}
.stat-row:last-child{border-bottom:none}
.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:#FFFFFF;border-top:2px solid #1A4A42;display:flex;justify-content:space-around;padding:10px 0 18px;z-index:30}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 16px;min-width:60px}
.nav-ic{font-size:22px;opacity:.2;transition:opacity .2s}
.nav-lbl{font-size:11px;color:#8AA8A4;font-weight:600}
.nav-item.active .nav-ic{opacity:1}
.nav-item.active .nav-lbl{color:#1A4A42}
.tab-page{position:fixed;inset:0;top:0;max-width:430px;left:50%;transform:translateX(-50%);background:#F0F7F5;overflow-y:auto;padding:72px 14px 80px;z-index:25}
.info-card{background:#FFFFFF;border:2px solid #B8D4CF;border-radius:14px;padding:16px;margin-bottom:12px}
.driver-card{background:#1A4A42;border-radius:14px;padding:18px;color:#FFFFFF;text-align:center;margin-bottom:14px}
.pulse-dot{width:10px;height:10px;border-radius:50%;background:#6ee7b7;display:inline-block;animation:blink 1.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{width:28px;height:28px;border:3px solid #E8F4F1;border-top-color:#1A4A42;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
.spinner-sm{width:16px;height:16px;border:2px solid #E8F4F1;border-top-color:#1A4A42;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}

/* POI suggestion items */
.poi-item{
  display:flex;align-items:center;gap:12px;
  padding:12px 14px;border-radius:12px;
  border:2px solid #B8D4CF;background:#FFFFFF;
  cursor:pointer;transition:border-color .15s,background .15s;
  width:100%;font-family:'Plus Jakarta Sans',sans-serif;
  min-height:60px;
}
.poi-item:hover{border-color:#1A4A42;background:#E8F4F1}
.poi-item.favorite{border-color:#D4A820;background:#FFFBF0}
.poi-item.placeholder{opacity:.45;cursor:not-allowed;border-style:dashed}
.poi-icon{width:36px;height:36px;border-radius:10px;background:#F0F7F5;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.poi-icon.fav{background:#FFF8E6}
.poi-name{font-size:14px;font-weight:700;color:#0D2420;margin-bottom:1px;text-align:left}
.poi-addr{font-size:11px;color:#5A7A76;font-weight:500;text-align:left}

/* Section label */
.section-lbl{font-size:10px;font-weight:700;color:#1A4A42;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;display:flex;align-items:center;gap:6px}
`

export default function PassengerDashboard() {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const pickupMk = useRef(null)
  const destMk = useRef(null)

  const [tab, setTab] = useState("home")
  const [pickup, setPickup] = useState(null)
  const [dest, setDest] = useState(null)
  const [pickupName, setPickupName] = useState("")
  const [destName, setDestName] = useState("")
  const [selectMode, setSelectMode] = useState(null)
  const [fare, setFare] = useState(null)
  const [dist, setDist] = useState(null)
  const [tip, setTip] = useState(0)
  const [step, setStep] = useState("idle")
  const [showSheet, setShowSheet] = useState(false)
  const [sheetTarget, setSheetTarget] = useState(null) // 'pickup' | 'dest'
  const [driverEta, setDriverEta] = useState(null)
  const [driverName, setDriverName] = useState("")
  const [showRating, setShowRating] = useState(false)

  // Dynamic POI state
  const [nearbyPOI, setNearbyPOI] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [userFavorites] = useState(DEFAULT_FAVORITES) // TODO: fetch from Supabase
  const [currentGPS, setCurrentGPS] = useState(null)

  const ff = "'Plus Jakarta Sans',sans-serif"
  const ff2 = "'Sora',sans-serif"

  useEffect(()=>{
    const link=document.createElement("link")
    link.rel="stylesheet"
    link.href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
    document.head.appendChild(link)
    const s=document.createElement("script")
    s.src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"
    s.onload=initMap
    document.head.appendChild(s)
  },[])

  const initMap=()=>{
    if(!mapRef.current||mapInst.current)return
    const mgl=window.mapboxgl
    mgl.accessToken=MAPBOX_TOKEN
    const map=new mgl.Map({
      container:mapRef.current,
      style:"mapbox://styles/mapbox/streets-v12",
      center:[JAKARTA_CENTER.lng,JAKARTA_CENTER.lat],
      zoom:13,attributionControl:false
    })
    map.on("load",()=>{
      mapInst.current=map
      navigator.geolocation?.getCurrentPosition(pos=>{
        const{latitude:lat,longitude:lng}=pos.coords
        setCurrentGPS({lat,lng})
        const el=document.createElement("div")
        el.style.cssText="width:16px;height:16px;border-radius:50%;background:#1A4A42;border:3px solid #FFFFFF;box-shadow:0 0 0 5px rgba(26,74,66,.25)"
        new mgl.Marker({element:el,anchor:"center"}).setLngLat([lng,lat]).addTo(map)
        map.flyTo({center:[lng,lat],zoom:15})
      })
    })
    map.on("click",e=>{
      if(!selectMode)return
      const{lng,lat}=e.lngLat
      if(selectMode==="pickup"){
        setPickup({lat,lng});reverseGeocode(lat,lng,setPickupName)
        addMarker(map,"pickup",lat,lng,mgl);setSelectMode(null);setShowSheet(false)
      }else{
        setDest({lat,lng});reverseGeocode(lat,lng,setDestName)
        addMarker(map,"dest",lat,lng,mgl);setSelectMode(null);setShowSheet(false)
      }
    })
  }

  // ── Auto-trigger GPS + fetch POI saat sheet dibuka ──
  const openSheet = useCallback((target) => {
    setSheetTarget(target)
    setShowSheet(true)
    setSelectMode(target)
    setNearbyPOI([]) // reset dulu

    // Hanya fetch POI untuk pickup
    if (target !== "pickup") return

    setGpsLoading(true)
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCurrentGPS({ lat, lng })
        // Update peta ke posisi user
        if (mapInst.current) {
          mapInst.current.flyTo({ center: [lng, lat], zoom: 15 })
        }
        const pois = await fetchNearbyPOI(lat, lng)
        setNearbyPOI(pois)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [selectMode])

  const addMarker=(map,type,lat,lng,mgl)=>{
    if(type==="pickup"){
      pickupMk.current?.remove()
      const el=document.createElement("div")
      el.innerHTML=`<div style="background:#1A4A42;color:#FFFFFF;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 3px 12px rgba(13,36,32,.4)">📍 Jemput</div>`
      pickupMk.current=new mgl.Marker({element:el,anchor:"bottom"}).setLngLat([lng,lat]).addTo(map)
    }else{
      destMk.current?.remove()
      const el=document.createElement("div")
      el.innerHTML=`<div style="background:#B5421A;color:#FFFFFF;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 3px 12px rgba(139,51,20,.4)">🏁 Tujuan</div>`
      destMk.current=new mgl.Marker({element:el,anchor:"bottom"}).setLngLat([lng,lat]).addTo(map)
    }
  }

  const reverseGeocode=async(lat,lng,setter)=>{
    try{
      const r=await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=id&limit=1`)
      const d=await r.json()
      setter(d.features?.[0]?.place_name?.split(",")[0]||`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }catch{setter(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)}
  }

  const selectPOI = (place, target) => {
    if (place.isPlaceholder) return
    const mgl = window.mapboxgl
    if (!mapInst.current || !mgl) return
    if (target === "pickup") {
      setPickup({ lat: place.lat, lng: place.lng })
      setPickupName(place.name)
      addMarker(mapInst.current, "pickup", place.lat, place.lng, mgl)
    } else {
      setDest({ lat: place.lat, lng: place.lng })
      setDestName(place.name)
      addMarker(mapInst.current, "dest", place.lat, place.lng, mgl)
    }
    mapInst.current.flyTo({ center: [place.lng, place.lat], zoom: 15 })
    setShowSheet(false)
    setSelectMode(null)
  }

  const hitungTarif=()=>{
    if(!pickup||!dest)return
    const d=calcDist(pickup,dest)
    setDist(d);setFare(calcFare(d));setStep("fare")
    if(mapInst.current){
      const bounds=new window.mapboxgl.LngLatBounds()
      bounds.extend([pickup.lng,pickup.lat]);bounds.extend([dest.lng,dest.lat])
      mapInst.current.fitBounds(bounds,{padding:100})
    }
  }

  const pesanSekarang=()=>{
    setStep("searching")
    const names=["Ahmad Ridho","Budi Santoso","Doni Pratama","Wawan Hermawan","Hendra K."]
    setTimeout(()=>{
      setDriverName(names[Math.floor(Math.random()*names.length)])
      setDriverEta(Math.floor(3+Math.random()*7))
      setStep("found")
    },3000)
  }

  const selesai=()=>setShowRating(true)
  const submitRating=()=>{
    setShowRating(false)
    setStep("idle");setPickup(null);setDest(null)
    setPickupName("");setDestName("");setFare(null);setDist(null);setTip(0)
  }

  const total=(fare||0)+tip

  // Gabung: POI dinamis (4) + favorit (2)
  const sheetItems = sheetTarget === "pickup"
    ? [...nearbyPOI.slice(0,4), ...userFavorites.slice(0,2)]
    : userFavorites // untuk tujuan, hanya favorit + ketuk peta

  return(
    <div style={{fontFamily:ff,background:T.surface2,minHeight:"100vh",color:T.ink,position:"relative",maxWidth:430,margin:"0 auto"}}>
      <style>{CSS}</style>

      <div ref={mapRef} style={{position:"fixed",inset:0,top:0,maxWidth:430,left:"50%",transform:"translateX(-50%)",zIndex:0}}/>

      {/* Header KSI */}
      {tab==="home"&&(
        <div className="header-bar">
          <div className="header-logo">🛺</div>
          <div>
            <div className="header-title">Koperasi Syarikat Islam</div>
            <div className="header-sub">Bajaj Listrik Jakarta</div>
          </div>
          {isPeak()&&<div className="header-badge">⚡ Peak</div>}
        </div>
      )}

      {/* Hint tap peta */}
      {selectMode&&(
        <div style={{position:"fixed",top:68,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:15,padding:"0 14px",pointerEvents:"none"}}>
          <div style={{background:selectMode==="pickup"?T.forest:T.terra,color:"#FFFFFF",borderRadius:12,padding:"12px 18px",textAlign:"center",fontSize:14,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.35)"}}>
            {selectMode==="pickup"?"📍 Atau ketuk peta langsung":"🏁 Atau ketuk peta langsung"}
          </div>
        </div>
      )}

      {/* HOME HUD */}
      {tab==="home"&&(
        <div style={{position:"fixed",bottom:62,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:10,padding:"0 14px"}}>

          {step==="idle"&&(
            <div className="card" style={{padding:16}}>
              <div style={{fontSize:11,color:T.forest,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12}}>Mau ke mana?</div>

              <div className={`input-wrap ${selectMode==="pickup"?"active":""}`} style={{marginBottom:4}}
                onClick={()=>openSheet("pickup")}>
                <div style={{width:10,height:10,borderRadius:"50%",background:T.forest,flexShrink:0,border:`2px solid ${T.forestM}`}}/>
                <div style={{flex:1}}>
                  <div className="input-label">Lokasi jemput</div>
                  {pickupName?<div className="input-val">{pickupName}</div>:<div className="input-placeholder">Pilih lokasi jemput</div>}
                </div>
                {pickup&&<span style={{fontSize:18,color:T.forest}}>✓</span>}
              </div>

              <div style={{width:2,height:10,background:T.borderL,margin:"0 0 4px 20px"}}/>

              <div className={`input-wrap ${selectMode==="dest"?"active":""}`}
                onClick={()=>openSheet("dest")}>
                <div style={{width:10,height:10,borderRadius:2,background:T.terra,flexShrink:0,border:`2px solid ${T.terraD}`}}/>
                <div style={{flex:1}}>
                  <div className="input-label" style={{color:T.terra}}>Tujuan</div>
                  {destName?<div className="input-val">{destName}</div>:<div className="input-placeholder">Pilih tujuan</div>}
                </div>
                {dest&&<span style={{fontSize:18,color:T.terra}}>✓</span>}
              </div>

              {pickup&&dest&&(
                <button className="btn-primary" style={{marginTop:14}} onClick={hitungTarif}>
                  Lihat estimasi tarif →
                </button>
              )}

              {isPeak()&&(
                <div style={{marginTop:12,background:T.warnBg,border:`2px solid ${T.warnBdr}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.warn,fontWeight:600,display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16}}>⚡</span>
                  <span>Peak hour — tarif sedikit lebih tinggi</span>
                </div>
              )}
            </div>
          )}

          {step==="fare"&&fare&&(
            <div className="card" style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:T.ink3,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Estimasi tarif</div>
                  <div style={{fontFamily:ff2,fontSize:34,fontWeight:700,color:T.terra,lineHeight:1}}>{`Rp ${fare.toLocaleString("id-ID")}`}</div>
                  <div style={{fontSize:13,color:T.ink2,fontWeight:600,marginTop:4}}>{dist?.toFixed(1)} km · ~{Math.round((dist||0)/25*60)} menit</div>
                </div>
                <div style={{textAlign:"right",paddingTop:4}}>
                  <div style={{fontSize:11,color:T.ink3,fontWeight:600,marginBottom:3}}>vs Gojek</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.forest,background:T.forestBg,padding:"3px 10px",borderRadius:20,border:`1.5px solid ${T.forest}`}}>≤ +20% ✓</div>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>
                  Tip driver <span style={{color:T.ink3,fontWeight:500,textTransform:"none"}}>— opsional</span>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {TIPS.map(t=>(
                    <button key={t} className={`tip-btn ${tip===t?"active":""}`} onClick={()=>setTip(t)}>
                      {t===0?"Tanpa tip":`+Rp ${t.toLocaleString("id-ID")}`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{background:T.forestBg,border:`2px solid ${T.forest}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:14,color:T.ink2,fontWeight:600}}>Total bayar</span>
                <span style={{fontFamily:ff2,fontSize:26,fontWeight:700,color:T.forest}}>{`Rp ${total.toLocaleString("id-ID")}`}</span>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn-ghost" style={{flex:1}} onClick={()=>setStep("idle")}>← Ubah</button>
                <button className="btn-cta" style={{flex:2}} onClick={pesanSekarang}>🛺 Pesan sekarang</button>
              </div>
            </div>
          )}

          {step==="searching"&&(
            <div className="card" style={{padding:20,textAlign:"center"}}>
              <div className="spinner"/>
              <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.ink,marginBottom:6}}>Mencari driver terdekat...</div>
              <div style={{fontSize:13,color:T.ink2,fontWeight:500}}>Mohon tunggu sebentar</div>
            </div>
          )}

          {step==="found"&&(
            <div className="card" style={{padding:16}}>
              <div className="driver-card">
                <div style={{fontSize:32,marginBottom:8}}>🛺</div>
                <div style={{fontFamily:ff2,fontSize:18,fontWeight:700,marginBottom:4}}>Driver ditemukan!</div>
                <div style={{fontSize:14,fontWeight:600,opacity:.9,marginBottom:10}}>{driverName} · {driverEta} menit lagi</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <div className="pulse-dot"/>
                  <span style={{fontSize:12,opacity:.85,fontWeight:500}}>Sedang menuju lokasi jemput</span>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn-ghost" style={{flex:1}}>📞 Hubungi</button>
                <button className="btn-primary" style={{flex:2}} onClick={()=>setStep("riding")}>✓ Oke, tunggu</button>
              </div>
            </div>
          )}

          {step==="riding"&&(
            <div className="card" style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div className="pulse-dot"/>
                <span style={{fontSize:12,fontWeight:700,color:T.forest,textTransform:"uppercase",letterSpacing:".06em"}}>Perjalanan berlangsung</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:T.ink}}>{driverName}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink2,marginTop:2}}>→ {destName}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:ff2,fontSize:22,fontWeight:700,color:T.terra}}>{`Rp ${total.toLocaleString("id-ID")}`}</div>
                  {tip>0&&<div style={{fontSize:12,fontWeight:600,color:T.warn}}>incl. tip Rp {tip.toLocaleString("id-ID")}</div>}
                </div>
              </div>
              <button className="btn-primary" onClick={selesai}>✅ Selesai & beri rating</button>
            </div>
          )}
        </div>
      )}

      {/* ── DYNAMIC LOCATION SHEET ── */}
      {showSheet&&(
        <div className="sheet-bg" onClick={()=>{setShowSheet(false);setSelectMode(null)}}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:5,borderRadius:3,background:T.borderL,margin:"0 auto 16px"}}/>

            <div style={{fontFamily:ff2,fontSize:17,fontWeight:700,color:T.ink,marginBottom:4}}>
              {sheetTarget==="pickup"?"Pilih lokasi jemput":"Pilih tujuan"}
            </div>
            <div style={{fontSize:12,color:T.ink2,fontWeight:500,marginBottom:16}}>
              {sheetTarget==="pickup"
                ? "Tempat terdekat dari posisi kamu sekarang"
                : "Pilih tujuan atau ketuk langsung di peta"}
            </div>

            {/* POI terdekat — hanya untuk pickup */}
            {sheetTarget==="pickup"&&(
              <div style={{marginBottom:16}}>
                <div className="section-lbl">
                  📍 Terdekat dari lokasimu
                  {gpsLoading&&<span className="spinner-sm" style={{marginLeft:6}}/>}
                </div>

                {gpsLoading&&nearbyPOI.length===0&&(
                  <div style={{padding:"12px 0",textAlign:"center",fontSize:13,color:T.ink3,fontWeight:500}}>
                    Mencari tempat terdekat...
                  </div>
                )}

                {nearbyPOI.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {nearbyPOI.map((p,i)=>(
                      <button key={i} className="poi-item" onClick={()=>selectPOI(p,sheetTarget)}>
                        <div className="poi-icon">{p.ic}</div>
                        <div style={{flex:1}}>
                          <div className="poi-name">{p.name}</div>
                          {p.address&&<div className="poi-addr">{p.address}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!gpsLoading&&nearbyPOI.length===0&&(
                  <div style={{padding:"10px 14px",background:T.forestBg,borderRadius:10,fontSize:12,color:T.ink2,fontWeight:500}}>
                    Aktifkan GPS untuk melihat tempat terdekat
                  </div>
                )}
              </div>
            )}

            {/* Favorit user */}
            <div style={{marginBottom:16}}>
              <div className="section-lbl">⭐ Favorit kamu</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {userFavorites.map((p,i)=>(
                  <button key={i}
                    className={`poi-item favorite ${p.isPlaceholder?"placeholder":""}`}
                    onClick={()=>!p.isPlaceholder&&selectPOI(p,sheetTarget)}>
                    <div className="poi-icon fav">{p.ic}</div>
                    <div style={{flex:1}}>
                      <div className="poi-name">{p.name}</div>
                      <div className="poi-addr">{p.isPlaceholder?"Belum diatur — ketuk peta untuk pilih":"Lokasi tersimpan"}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={()=>setShowSheet(false)}>
              🗺️ Ketuk peta untuk lokasi lain
            </button>
          </div>
        </div>
      )}

      {/* Rating sheet */}
      {showRating&&(
        <div className="sheet-bg">
          <div className="sheet" style={{textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:10}}>⭐</div>
            <div style={{fontFamily:ff2,fontSize:20,fontWeight:700,color:T.ink,marginBottom:4}}>Beri rating driver</div>
            <div style={{fontSize:14,fontWeight:600,color:T.ink2,marginBottom:24}}>{driverName}</div>
            <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:24}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>submitRating(s)}
                  style={{fontSize:40,background:"none",border:"none",cursor:"pointer",transition:"transform .15s",minWidth:44,minHeight:44}}
                  onMouseEnter={e=>(e.target.style.transform="scale(1.25)")}
                  onMouseLeave={e=>(e.target.style.transform="scale(1)")}>⭐</button>
              ))}
            </div>
            <button className="btn-ghost" style={{width:"100%"}} onClick={()=>submitRating(5)}>Lewati</button>
          </div>
        </div>
      )}

      {/* Riwayat tab */}
      {tab==="riwayat"&&(
        <div className="tab-page">
          <div style={{background:T.forest,borderRadius:16,padding:"16px 18px",marginBottom:16,color:"#FFFFFF"}}>
            <div style={{fontSize:11,opacity:.8,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>Koperasi Syarikat Islam</div>
            <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,marginBottom:2}}>Riwayat Perjalanan</div>
            <div style={{fontSize:13,fontWeight:600,opacity:.85}}>3 trip · Total Rp 62.000</div>
          </div>
          {[
            {dest:"Blok M",dist:"3.2",fare:15000,tip:5000,date:"Hari ini, 11:24",driver:"Ahmad R."},
            {dest:"Sudirman",dist:"5.8",fare:25000,tip:0,date:"Kemarin, 08:15",driver:"Budi S."},
            {dest:"Monas",dist:"2.1",fare:15000,tip:2000,date:"Senin, 16:40",driver:"Doni P."},
          ].map((r,i)=>(
            <div key={i} className="info-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.ink}}>→ {r.dest}</div>
                  <div style={{fontSize:12,fontWeight:600,color:T.ink2,marginTop:2}}>{r.dist} km · {r.date}</div>
                  <div style={{fontSize:12,color:T.ink3,marginTop:1}}>Driver: {r.driver}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:ff2,fontSize:18,fontWeight:700,color:T.terra}}>{`Rp ${(r.fare+r.tip).toLocaleString("id-ID")}`}</div>
                  {r.tip>0&&<div style={{fontSize:12,fontWeight:600,color:T.warn}}>+tip Rp {r.tip.toLocaleString("id-ID")}</div>}
                </div>
              </div>
              <div style={{paddingTop:8,borderTop:`1.5px solid ${T.forestBg}`,fontSize:12,fontWeight:600,color:T.forest}}>⭐⭐⭐⭐⭐ Selesai</div>
            </div>
          ))}
        </div>
      )}

      {/* Profil tab */}
      {tab==="profil"&&(
        <div className="tab-page">
          <div style={{background:T.forest,borderRadius:16,padding:"18px",marginBottom:16,display:"flex",gap:14,alignItems:"center",color:"#FFFFFF"}}>
            <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"2.5px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>👤</div>
            <div>
              <div style={{fontFamily:ff2,fontSize:17,fontWeight:700}}>Penumpang</div>
              <div style={{fontSize:13,opacity:.8,fontWeight:500,marginBottom:6}}>penumpang@bajaj.com</div>
              <div style={{background:T.terra,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block"}}>Member Koperasi</div>
            </div>
          </div>
          <div className="info-card">
            <div className="stat-row"><span style={{color:T.ink3,fontWeight:600}}>Total perjalanan</span><span style={{fontWeight:700,color:T.ink}}>3 trip</span></div>
            <div className="stat-row"><span style={{color:T.ink3,fontWeight:600}}>Total pengeluaran</span><span style={{fontWeight:700,color:T.ink}}>Rp 62.000</span></div>
            <div className="stat-row"><span style={{color:T.ink3,fontWeight:600}}>CO₂ dihemat</span><span style={{fontWeight:700,color:T.forest}}>~1.2 kg 🌿</span></div>
            <div className="stat-row"><span style={{color:T.ink3,fontWeight:600}}>Rating rata-rata</span><span style={{fontWeight:700,color:T.ink}}>⭐ 5.0</span></div>
          </div>
          <div style={{background:T.forestBg,border:`2px solid ${T.forest}`,borderRadius:12,padding:"14px 16px",fontSize:13,fontWeight:600,color:T.forestD,lineHeight:1.7}}>
            🌿 Dengan naik bajaj listrik Koperasi Syarikat Islam, kamu berkontribusi mengurangi polusi Jakarta dan mendukung ekonomi kerakyatan!
          </div>
        </div>
      )}

      <nav className="nav-bar">
        {[{id:"home",ic:"🛺",lbl:"Pesan"},{id:"riwayat",ic:"🕐",lbl:"Riwayat"},{id:"profil",ic:"👤",lbl:"Profil"}].map(n=>(
          <div key={n.id} className={`nav-item ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <div className="nav-ic">{n.ic}</div>
            <div className="nav-lbl">{n.lbl}</div>
          </div>
        ))}
      </nav>
    </div>
  )
}
