// src/components/passenger/PassengerDashboard.tsx
// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from "react"

const MAPBOX_TOKEN = "pk.eyJ1Ijoicm9kYXRpZ2FqYWthcnRhIiwiYSI6ImNtb2kzajdxMTAycnYycnBuaXJ2ZnBkbjIifQ.BRtYhcrtisAEZWWyM0ShlA"
const JAKARTA_CENTER = { lng: 106.8272, lat: -6.1751 }

const T = {
  ash:"#F5F0EB",ash2:"#EDE6DC",ash3:"#DDD3C4",ash4:"#BFB3A3",ash6:"#5C5248",
  ink:"#2C2420",ink2:"#6B5D54",ink3:"#9C8E85",
  ore:"#C4622D",oreD:"#8F4420",oreBg:"#F7ECE4",oreBg2:"#F0DDD0",
  warn:"#D4891A",warnBg:"#FBF3E3",
  good:"#4A7C59",goodBg:"#EAF3EE",
  surface:"#FFFCF9",card:"#FFFFFF",border:"#E8DDD4",
}

const BASE_FARES = [{max:4,fare:15000,label:"Dekat"},{max:8,fare:25000,label:"Sedang"},{max:15,fare:50000,label:"Jauh"}]
const GOJEK_FARES = [18000,28000,55000]
const PEAK_HOURS = [{s:7,e:9},{s:11,e:13},{s:16,e:19}]

function isPeak(){const h=new Date().getHours();return PEAK_HOURS.some(p=>h>=p.s&&h<p.e)}
function calcFare(km){
  const i=km<=4?0:km<=8?1:2
  const surge=isPeak()?1.15:1
  return Math.max(15000,Math.min(Math.round(BASE_FARES[i].fare*surge/1000)*1000,GOJEK_FARES[i]*1.2))
}
function calcDist(a,b){
  const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))
}

const TIPS = [0,2000,5000,10000,20000]
const POPULAR = [
  {name:"Blok M",lat:-6.2441,lng:106.7989},
  {name:"Sudirman",lat:-6.2088,lng:106.8230},
  {name:"Monas",lat:-6.1754,lng:106.8272},
  {name:"Kemayoran",lat:-6.1620,lng:106.8551},
  {name:"Tanah Abang",lat:-6.1863,lng:106.8114},
  {name:"Senen",lat:-6.1763,lng:106.8447},
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Sora:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:${T.ash}}

.glass{background:rgba(255,252,249,0.93);border:1px solid rgba(232,221,212,0.7);border-radius:14px;backdrop-filter:blur(18px) saturate(1.2)}
.btn-ore{background:${T.ore};color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:background .15s,transform .1s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-ore:hover{background:${T.oreD}}
.btn-ore:active{transform:scale(.97)}
.btn-ore:disabled{opacity:.5;cursor:not-allowed}
.btn-ghost{background:${T.ash2};border:1px solid ${T.border};border-radius:10px;color:${T.ink2};padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
.btn-ghost:hover{background:${T.ash3}}

.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.p-ore{background:${T.oreBg2};color:${T.oreD}}
.p-good{background:${T.goodBg};color:${T.good}}
.p-warn{background:${T.warnBg};color:${T.warn}}
.p-ash{background:${T.ash2};color:${T.ash6}}

.stat-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid ${T.border};font-size:13px}
.stat-row:last-child{border-bottom:none}

.sheet-bg{position:fixed;inset:0;background:rgba(44,36,32,.6);z-index:40;display:flex;align-items:flex-end;justify-content:center;padding:0 0 0}
.sheet{width:100%;max-width:430px;background:${T.surface};border-radius:20px 20px 0 0;padding:20px;max-height:85vh;overflow-y:auto;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}

.input-wrap{background:${T.ash};border:1.5px solid ${T.border};border-radius:10px;padding:11px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .15s}
.input-wrap:hover{border-color:${T.ore}}
.input-wrap.active{border-color:${T.ore};background:${T.oreBg}}
.input-label{font-size:11px;color:${T.ink3};margin-bottom:2px}
.input-val{font-size:13px;font-weight:500;color:${T.ink}}
.input-placeholder{font-size:13px;color:${T.ash4}}

.tip-btn{padding:8px 14px;border-radius:8px;border:1.5px solid ${T.border};background:${T.card};font-size:13px;font-weight:500;cursor:pointer;color:${T.ink};transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.tip-btn.active{background:${T.oreBg2};border-color:${T.ore};color:${T.oreD};font-weight:600}

.driver-found{background:linear-gradient(135deg,${T.ore},${T.oreD});border-radius:16px;padding:16px;color:#fff;text-align:center}
.pulse-dot{width:10px;height:10px;border-radius:50%;background:${T.good};display:inline-block;animation:blink 1.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(255,252,249,.97);border-top:1px solid ${T.border};display:flex;justify-content:space-around;padding:10px 0 18px;z-index:30;backdrop-filter:blur(20px)}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 14px}
.nav-ic{font-size:19px;opacity:.25;transition:opacity .2s}
.nav-lbl{font-size:10px;color:${T.ink3};font-weight:500}
.nav-item.active .nav-ic{opacity:1}
.nav-item.active .nav-lbl{color:${T.ore}}

.tab-page{position:fixed;inset:0;top:0;max-width:430px;left:50%;transform:translateX(-50%);background:${T.ash};overflow-y:auto;padding:20px 14px 80px;z-index:25}
.eyebrow{font-size:10px;color:${T.ink3};text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.page-title{font-family:'Sora',sans-serif;font-size:22px;font-weight:700;color:${T.ink};margin-bottom:18px}
.info-card{background:${T.card};border:1px solid ${T.border};border-radius:14px;padding:14px;margin-bottom:12px}
.info-box{background:${T.oreBg};border:1px solid rgba(196,98,45,.2);border-radius:10px;padding:12px 14px;font-size:12px;color:${T.oreD};line-height:1.7}
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
  const [selectMode, setSelectMode] = useState(null) // 'pickup' | 'dest'
  const [fare, setFare] = useState(null)
  const [dist, setDist] = useState(null)
  const [tip, setTip] = useState(0)
  const [step, setStep] = useState("idle") // idle | fare | searching | found | riding
  const [showPopular, setShowPopular] = useState(false)
  const [popularTarget, setPopularTarget] = useState(null)
  const [driverEta, setDriverEta] = useState(null)
  const [driverName, setDriverName] = useState("")

  const ff = "'Plus Jakarta Sans',sans-serif"
  const ff2 = "'Sora',sans-serif"
  const card = {background:"rgba(255,252,249,0.93)",border:`1px solid rgba(232,221,212,0.7)`,borderRadius:14,backdropFilter:"blur(18px) saturate(1.2)"}

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
      style:"mapbox://styles/mapbox/light-v11",
      center:[JAKARTA_CENTER.lng,JAKARTA_CENTER.lat],
      zoom:13,attributionControl:false
    })
    map.on("load",()=>{
      mapInst.current=map
      // User location dot
      navigator.geolocation?.getCurrentPosition(pos=>{
        const {latitude:lat,longitude:lng}=pos.coords
        const el=document.createElement("div")
        el.style.cssText="width:14px;height:14px;border-radius:50%;background:#4A7C59;border:3px solid #fff;box-shadow:0 0 0 4px rgba(74,124,89,.25)"
        new mgl.Marker({element:el,anchor:"center"}).setLngLat([lng,lat]).addTo(map)
        map.flyTo({center:[lng,lat],zoom:14})
      })
    })
    map.on("click",e=>{
      if(!selectMode)return
      const {lng,lat}=e.lngLat
      if(selectMode==="pickup"){
        setPickup({lat,lng})
        reverseGeocode(lat,lng,setPickupName)
        addMarker(map,"pickup",lat,lng,mgl)
        setSelectMode(null)
        setShowPopular(false)
      } else if(selectMode==="dest"){
        setDest({lat,lng})
        reverseGeocode(lat,lng,setDestName)
        addMarker(map,"dest",lat,lng,mgl)
        setSelectMode(null)
        setShowPopular(false)
      }
    })
  }

  const addMarker=(map,type,lat,lng,mgl)=>{
    if(type==="pickup"){
      pickupMk.current?.remove()
      const el=document.createElement("div")
      el.innerHTML=`<div style="background:${T.ore};color:#fff;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.2)">📍 Jemput</div>`
      pickupMk.current=new mgl.Marker({element:el,anchor:"bottom"}).setLngLat([lng,lat]).addTo(map)
    } else {
      destMk.current?.remove()
      const el=document.createElement("div")
      el.innerHTML=`<div style="background:${T.oreD};color:#fff;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.2)">🏁 Tujuan</div>`
      destMk.current=new mgl.Marker({element:el,anchor:"bottom"}).setLngLat([lng,lat]).addTo(map)
    }
  }

  const reverseGeocode=async(lat,lng,setter)=>{
    try{
      const r=await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=id&limit=1`)
      const d=await r.json()
      setter(d.features?.[0]?.place_name?.split(",")[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }catch{setter(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)}
  }

  const selectPopular=(place,target)=>{
    const mgl=window.mapboxgl
    if(!mapInst.current||!mgl)return
    if(target==="pickup"){
      setPickup({lat:place.lat,lng:place.lng})
      setPickupName(place.name)
      addMarker(mapInst.current,"pickup",place.lat,place.lng,mgl)
    } else {
      setDest({lat:place.lat,lng:place.lng})
      setDestName(place.name)
      addMarker(mapInst.current,"dest",place.lat,place.lng,mgl)
    }
    mapInst.current.flyTo({center:[place.lng,place.lat],zoom:15})
    setShowPopular(false)
    setSelectMode(null)
  }

  const hitungTarif=()=>{
    if(!pickup||!dest)return
    const d=calcDist(pickup,dest)
    const f=calcFare(d)
    setDist(d)
    setFare(f)
    setStep("fare")
    if(mapInst.current&&pickup&&dest){
      const bounds=new window.mapboxgl.LngLatBounds()
      bounds.extend([pickup.lng,pickup.lat])
      bounds.extend([dest.lng,dest.lat])
      mapInst.current.fitBounds(bounds,{padding:80})
    }
  }

  const pesanSekarang=()=>{
    setStep("searching")
    const names=["Ahmad R.","Budi S.","Doni P.","Wawan T.","Hendra K."]
    setTimeout(()=>{
      setDriverName(names[Math.floor(Math.random()*names.length)])
      setDriverEta(Math.floor(3+Math.random()*7))
      setStep("found")
    },3000)
  }

  const mulaiPerjalanan=()=>setStep("riding")
  const selesai=()=>{setStep("idle");setPickup(null);setDest(null);setPickupName("");setDestName("");setFare(null);setDist(null);setTip(0)}

  const total=(fare||0)+tip

  return(
    <div style={{fontFamily:ff,background:T.ash,minHeight:"100vh",color:T.ink,position:"relative",maxWidth:430,margin:"0 auto"}}>
      <style>{CSS}</style>

      {/* Map */}
      <div ref={mapRef} style={{position:"fixed",inset:0,top:0,maxWidth:430,left:"50%",transform:"translateX(-50%)",zIndex:0}}/>

      {/* Select mode overlay */}
      {selectMode&&(
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:15,padding:"48px 14px 0",pointerEvents:"none"}}>
          <div style={{background:selectMode==="pickup"?T.ore:T.oreD,color:"#fff",borderRadius:12,padding:"10px 16px",textAlign:"center",fontSize:13,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,.2)"}}>
            {selectMode==="pickup"?"📍 Ketuk peta untuk pilih lokasi jemput":"🏁 Ketuk peta untuk pilih tujuan"}
          </div>
        </div>
      )}

      {/* HOME TAB */}
      {tab==="home"&&(
        <>
          {/* Bottom sheet input */}
          <div style={{position:"fixed",bottom:62,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:10,padding:"0 14px"}}>

            {/* IDLE / INPUT */}
            {(step==="idle")&&(
              <div style={{...card,padding:16}}>
                <div style={{fontSize:10,color:T.ink3,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Mau ke mana?</div>

                {/* Pickup input */}
                <div className={`input-wrap ${selectMode==="pickup"?"active":""}`} style={{marginBottom:8}}
                  onClick={()=>{setSelectMode("pickup");setShowPopular(true);setPopularTarget("pickup")}}>
                  <span style={{fontSize:16}}>📍</span>
                  <div style={{flex:1}}>
                    <div className="input-label">Lokasi jemput</div>
                    {pickupName?<div className="input-val">{pickupName}</div>:<div className="input-placeholder">Pilih di peta atau lokasi populer</div>}
                  </div>
                  {pickup&&<span style={{fontSize:12,color:T.good}}>✓</span>}
                </div>

                {/* Dest input */}
                <div className={`input-wrap ${selectMode==="dest"?"active":""}`}
                  onClick={()=>{setSelectMode("dest");setShowPopular(true);setPopularTarget("dest")}}>
                  <span style={{fontSize:16}}>🏁</span>
                  <div style={{flex:1}}>
                    <div className="input-label">Tujuan</div>
                    {destName?<div className="input-val">{destName}</div>:<div className="input-placeholder">Pilih di peta atau lokasi populer</div>}
                  </div>
                  {dest&&<span style={{fontSize:12,color:T.good}}>✓</span>}
                </div>

                {pickup&&dest&&(
                  <button className="btn-ore" style={{marginTop:12}} onClick={hitungTarif}>
                    Hitung tarif →
                  </button>
                )}

                {isPeak()&&(
                  <div style={{marginTop:10,background:T.warnBg,border:`1px solid rgba(212,137,26,.2)`,borderRadius:8,padding:"8px 12px",fontSize:11,color:T.warn}}>
                    ⚡ Peak hour — surge aktif, tarif sedikit lebih tinggi
                  </div>
                )}
              </div>
            )}

            {/* FARE STEP */}
            {step==="fare"&&fare&&(
              <div style={{...card,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:10,color:T.ink3,textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>Estimasi tarif</div>
                    <div style={{fontFamily:ff2,fontSize:28,fontWeight:700,color:T.ore}}>Rp {fare.toLocaleString("id-ID")}</div>
                    <div style={{fontSize:12,color:T.ink3}}>{dist?.toFixed(1)} km · {Math.round((dist||0)/25*60)} mnt perjalanan</div>
                  </div>
                  {isPeak()&&<span className="pill p-warn">⚡ Peak</span>}
                </div>

                {/* Tip */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:8}}>Tip untuk driver (opsional)</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {TIPS.map(t=>(
                      <button key={t} className={`tip-btn ${tip===t?"active":""}`} onClick={()=>setTip(t)}>
                        {t===0?"Tanpa tip":`+Rp ${t.toLocaleString("id-ID")}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{background:T.ash,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:T.ink2}}>Total bayar</span>
                  <span style={{fontFamily:ff2,fontSize:20,fontWeight:700,color:T.ore}}>Rp {total.toLocaleString("id-ID")}</span>
                </div>

                <div style={{display:"flex",gap:8}}>
                  <button className="btn-ghost" style={{flex:1}} onClick={()=>setStep("idle")}>← Ubah</button>
                  <button className="btn-ore" style={{flex:2}} onClick={pesanSekarang}>🛺 Pesan sekarang</button>
                </div>
              </div>
            )}

            {/* SEARCHING */}
            {step==="searching"&&(
              <div style={{...card,padding:16,textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:10}}>🔍</div>
                <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.ink,marginBottom:4}}>Mencari driver terdekat...</div>
                <div style={{fontSize:12,color:T.ink3,marginBottom:14}}>Mohon tunggu sebentar</div>
                <div style={{display:"flex",justifyContent:"center",gap:6}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.ore,animation:`blink 1.2s ${i*.2}s ease-in-out infinite`}}/>
                  ))}
                </div>
              </div>
            )}

            {/* FOUND */}
            {step==="found"&&(
              <div style={{...card,padding:16}}>
                <div className="driver-found" style={{marginBottom:14}}>
                  <div style={{fontSize:28,marginBottom:6}}>🛺</div>
                  <div style={{fontFamily:ff2,fontSize:17,fontWeight:700,marginBottom:4}}>Driver ditemukan!</div>
                  <div style={{fontSize:13,opacity:.85}}>{driverName} · ETA {driverEta} menit</div>
                  <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <div className="pulse-dot"/>
                    <span style={{fontSize:11}}>Menuju lokasi jemput</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-ghost" style={{flex:1}}>📞 Hubungi</button>
                  <button className="btn-ore" style={{flex:2}} onClick={mulaiPerjalanan}>✓ Konfirmasi</button>
                </div>
              </div>
            )}

            {/* RIDING */}
            {step==="riding"&&(
              <div style={{...card,padding:16}}>
                <div style={{fontSize:10,fontWeight:600,color:T.ore,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>● Perjalanan berlangsung</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:600,color:T.ink}}>{driverName}</div>
                    <div style={{fontSize:12,color:T.ink3}}>→ {destName}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:ff2,fontSize:20,fontWeight:700,color:T.ore}}>Rp {total.toLocaleString("id-ID")}</div>
                    {tip>0&&<div style={{fontSize:11,color:T.warn}}>incl. tip Rp {tip.toLocaleString("id-ID")}</div>}
                  </div>
                </div>
                <button className="btn-ore" onClick={selesai}>✅ Selesai & bayar</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* POPULAR SHEET */}
      {showPopular&&(
        <div className="sheet-bg" onClick={()=>{setShowPopular(false);setSelectMode(null)}}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:T.ash3,margin:"0 auto 16px"}}/>
            <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.ink,marginBottom:4}}>
              {popularTarget==="pickup"?"Pilih lokasi jemput":"Pilih tujuan"}
            </div>
            <div style={{fontSize:12,color:T.ink3,marginBottom:14}}>Pilih lokasi populer atau ketuk peta</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {POPULAR.map(p=>(
                <button key={p.name} onClick={()=>selectPopular(p,popularTarget)}
                  style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px",textAlign:"left",cursor:"pointer",transition:"border-color .15s",fontFamily:ff}}>
                  <div style={{fontSize:18,marginBottom:4}}>📍</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{p.name}</div>
                </button>
              ))}
            </div>
            <button className="btn-ore" style={{marginTop:14}} onClick={()=>{setShowPopular(false)}}>
              Ketuk peta untuk pilih lokasi
            </button>
          </div>
        </div>
      )}

      {/* RIWAYAT TAB */}
      {tab==="riwayat"&&(
        <div className="tab-page">
          <div className="eyebrow">Riwayat</div>
          <div className="page-title">Perjalanan saya</div>
          {[
            {dest:"Blok M",dist:"3.2",fare:15000,tip:5000,date:"Hari ini, 11:24"},
            {dest:"Sudirman",dist:"5.8",fare:25000,tip:0,date:"Kemarin, 08:15"},
            {dest:"Monas",dist:"2.1",fare:15000,tip:2000,date:"Senin, 16:40"},
          ].map((r,i)=>(
            <div key={i} className="info-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:2}}>→ {r.dest}</div>
                  <div style={{fontSize:11,color:T.ink3}}>{r.dist} km · {r.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.ore}}>Rp {(r.fare+r.tip).toLocaleString("id-ID")}</div>
                  {r.tip>0&&<div style={{fontSize:10,color:T.warn}}>+tip Rp {r.tip.toLocaleString("id-ID")}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROFIL TAB */}
      {tab==="profil"&&(
        <div className="tab-page">
          <div className="eyebrow">Akun</div>
          <div className="page-title">Profil saya</div>
          <div className="info-card" style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:T.oreBg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👤</div>
            <div>
              <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.ink}}>Penumpang</div>
              <div style={{fontSize:12,color:T.ink3}}>penumpang@bajaj.com</div>
            </div>
          </div>
          <div className="info-card">
            <div className="stat-row"><span style={{color:T.ink3}}>Total perjalanan</span><span style={{fontWeight:600}}>3 trip</span></div>
            <div className="stat-row"><span style={{color:T.ink3}}>Total pengeluaran</span><span style={{fontWeight:600}}>Rp 62.000</span></div>
            <div className="stat-row"><span style={{color:T.ink3}}>CO₂ dihemat</span><span style={{fontWeight:600,color:T.good}}>~1.2 kg</span></div>
          </div>
          <div className="info-box">
            🌿 Dengan naik bajaj listrik, kamu membantu mengurangi emisi karbon Jakarta!
          </div>
        </div>
      )}

      {/* NAV */}
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
