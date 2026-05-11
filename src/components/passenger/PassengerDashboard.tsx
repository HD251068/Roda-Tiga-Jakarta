// src/components/passenger/PassengerDashboard.tsx
// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from "react"

const MAPBOX_TOKEN = "pk.eyJ1Ijoicm9kYXRpZ2FqYWthcnRhIiwiYSI6ImNtb2kzajdxMTAycnYycnBuaXJ2ZnBkbjIifQ.BRtYhcrtisAEZWWyM0ShlA"
const JAKARTA_CENTER = { lng: 106.8272, lat: -6.1751 }

const T = {
  sage:"#4A7C6F", sageD:"#2F5C52", sageL:"#6B9E92", sageBg:"#EDF4F2", sageBg2:"#D6EAE6",
  terra:"#C45E3E", terraD:"#8F3E25", terraBg:"#F8EDE8", terraBg2:"#F0D9D0",
  cream:"#FDFAF6", cream2:"#F5EFE7", cream3:"#EAE0D5", cream4:"#D4C8BB",
  ink:"#1E2D2A", ink2:"#4A5E5A", ink3:"#8A9E9A",
  card:"#FFFFFF", border:"#E0D8CE", warn:"#C48A1A", warnBg:"#FBF4E3", good:"#4A7C59",
}

const PEAK_HOURS = [{s:7,e:9},{s:11,e:13},{s:16,e:19}]
const BASE_FARES = [15000,25000,50000]
const GOJEK_FARES = [18000,28000,55000]
const TIPS = [0,2000,5000,10000,20000]
const POPULAR = [
  {name:"Blok M",      ic:"🏢", lat:-6.2441, lng:106.7989},
  {name:"Sudirman",    ic:"🏙️", lat:-6.2088, lng:106.8230},
  {name:"Monas",       ic:"🗼", lat:-6.1754, lng:106.8272},
  {name:"Kemayoran",   ic:"✈️", lat:-6.1620, lng:106.8551},
  {name:"Tanah Abang", ic:"🛍️", lat:-6.1863, lng:106.8114},
  {name:"Senen",       ic:"🚉", lat:-6.1763, lng:106.8447},
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Sora:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.btn-sage{background:#4A7C6F;color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:background .15s,transform .1s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-sage:hover{background:#2F5C52}
.btn-sage:active{transform:scale(.97)}
.btn-sage:disabled{opacity:.5;cursor:not-allowed}
.btn-terra{background:#C45E3E;color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:background .15s,transform .1s;font-family:'Plus Jakarta Sans',sans-serif}
.btn-terra:hover{background:#8F3E25}
.btn-terra:active{transform:scale(.97)}
.btn-ghost{background:#F5EFE7;border:1px solid #E0D8CE;border-radius:10px;color:#4A5E5A;padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .15s}
.btn-ghost:hover{background:#EAE0D5}
.glass{background:rgba(253,250,246,0.95);border:1px solid rgba(224,216,206,0.8);border-radius:16px;backdrop-filter:blur(20px) saturate(1.3)}
.input-wrap{background:#F5EFE7;border:1.5px solid #E0D8CE;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .15s,background .15s}
.input-wrap:hover,.input-wrap.active{border-color:#4A7C6F;background:#EDF4F2}
.input-label{font-size:10px;color:#8A9E9A;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
.input-val{font-size:13px;font-weight:600;color:#1E2D2A}
.input-placeholder{font-size:13px;color:#D4C8BB}
.tip-btn{padding:8px 12px;border-radius:8px;border:1.5px solid #E0D8CE;background:#fff;font-size:12px;font-weight:500;cursor:pointer;color:#1E2D2A;transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.tip-btn.active{background:#F0D9D0;border-color:#C45E3E;color:#8F3E25;font-weight:600}
.sheet-bg{position:fixed;inset:0;background:rgba(30,45,42,.65);z-index:40;display:flex;align-items:flex-end;justify-content:center}
.sheet{width:100%;max-width:430px;background:#FDFAF6;border-radius:20px 20px 0 0;padding:20px;max-height:88vh;overflow-y:auto;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.header-bar{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:20;background:linear-gradient(135deg,#2F5C52,#4A7C6F);padding:14px 16px 12px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 16px rgba(47,92,82,.3)}
.header-logo{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid rgba(255,255,255,.2)}
.header-title{font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#fff;line-height:1.2}
.header-sub{font-size:10px;color:rgba(255,255,255,.7);font-weight:400}
.header-badge{margin-left:auto;background:rgba(196,94,62,.9);color:#fff;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600}
.stat-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #E0D8CE;font-size:13px}
.stat-row:last-child{border-bottom:none}
.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(253,250,246,.97);border-top:1px solid #E0D8CE;display:flex;justify-content:space-around;padding:10px 0 18px;z-index:30;backdrop-filter:blur(20px)}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 14px}
.nav-ic{font-size:19px;opacity:.25;transition:opacity .2s}
.nav-lbl{font-size:10px;color:#8A9E9A;font-weight:500}
.nav-item.active .nav-ic{opacity:1}
.nav-item.active .nav-lbl{color:#4A7C6F}
.tab-page{position:fixed;inset:0;top:0;max-width:430px;left:50%;transform:translateX(-50%);background:#F5EFE7;overflow-y:auto;padding:72px 14px 80px;z-index:25}
.info-card{background:#fff;border:1px solid #E0D8CE;border-radius:14px;padding:14px;margin-bottom:12px}
.info-box-sage{background:#EDF4F2;border:1px solid rgba(74,124,111,.2);border-radius:10px;padding:12px 14px;font-size:12px;color:#2F5C52;line-height:1.7}
.driver-card{background:linear-gradient(135deg,#2F5C52,#4A7C6F);border-radius:16px;padding:18px;color:#fff;text-align:center;margin-bottom:14px}
.pulse-dot{width:8px;height:8px;border-radius:50%;background:#6ee7b7;display:inline-block;animation:blink 1.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{width:24px;height:24px;border:3px solid rgba(74,124,111,.2);border-top-color:#4A7C6F;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px}
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
  const [showPopular, setShowPopular] = useState(false)
  const [popularTarget, setPopularTarget] = useState(null)
  const [driverEta, setDriverEta] = useState(null)
  const [driverName, setDriverName] = useState("")
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)

  const ff = "'Plus Jakarta Sans',sans-serif"
  const ff2 = "'Sora',sans-serif"
  const glass = {background:"rgba(253,250,246,0.95)",border:"1px solid rgba(224,216,206,0.8)",borderRadius:16,backdropFilter:"blur(20px) saturate(1.3)"}

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
      navigator.geolocation?.getCurrentPosition(pos=>{
        const{latitude:lat,longitude:lng}=pos.coords
        const el=document.createElement("div")
        el.style.cssText="width:14px;height:14px;border-radius:50%;background:#4A7C6F;border:3px solid #fff;box-shadow:0 0 0 5px rgba(74,124,111,.2)"
        new mgl.Marker({element:el,anchor:"center"}).setLngLat([lng,lat]).addTo(map)
        map.flyTo({center:[lng,lat],zoom:14})
      })
    })
    map.on("click",e=>{
      if(!selectMode)return
      const{lng,lat}=e.lngLat
      if(selectMode==="pickup"){
        setPickup({lat,lng});reverseGeocode(lat,lng,setPickupName)
        addMarker(map,"pickup",lat,lng,mgl);setSelectMode(null);setShowPopular(false)
      }else{
        setDest({lat,lng});reverseGeocode(lat,lng,setDestName)
        addMarker(map,"dest",lat,lng,mgl);setSelectMode(null);setShowPopular(false)
      }
    })
  }

  const addMarker=(map,type,lat,lng,mgl)=>{
    if(type==="pickup"){
      pickupMk.current?.remove()
      const el=document.createElement("div")
      el.innerHTML=`<div style="background:#4A7C6F;color:#fff;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 10px rgba(47,92,82,.35)">📍 Jemput</div>`
      pickupMk.current=new mgl.Marker({element:el,anchor:"bottom"}).setLngLat([lng,lat]).addTo(map)
    }else{
      destMk.current?.remove()
      const el=document.createElement("div")
      el.innerHTML=`<div style="background:#C45E3E;color:#fff;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 10px rgba(196,94,62,.35)">🏁 Tujuan</div>`
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

  const selectPopular=(place,target)=>{
    const mgl=window.mapboxgl
    if(!mapInst.current||!mgl)return
    if(target==="pickup"){setPickup({lat:place.lat,lng:place.lng});setPickupName(place.name);addMarker(mapInst.current,"pickup",place.lat,place.lng,mgl)}
    else{setDest({lat:place.lat,lng:place.lng});setDestName(place.name);addMarker(mapInst.current,"dest",place.lat,place.lng,mgl)}
    mapInst.current.flyTo({center:[place.lng,place.lat],zoom:15})
    setShowPopular(false);setSelectMode(null)
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

  const submitRating=(r)=>{
    setRating(r);setShowRating(false)
    setStep("idle");setPickup(null);setDest(null)
    setPickupName("");setDestName("");setFare(null);setDist(null);setTip(0)
  }

  const total=(fare||0)+tip

  return(
    <div style={{fontFamily:ff,background:T.cream2,minHeight:"100vh",color:T.ink,position:"relative",maxWidth:430,margin:"0 auto"}}>
      <style>{CSS}</style>

      <div ref={mapRef} style={{position:"fixed",inset:0,top:0,maxWidth:430,left:"50%",transform:"translateX(-50%)",zIndex:0}}/>

      {tab==="home"&&(
        <div className="header-bar">
          <div className="header-logo">🛺</div>
          <div>
            <div className="header-title">Koperasi Syarikat Islam</div>
            <div className="header-sub">Bajaj Listrik Jakarta</div>
          </div>
          {isPeak()&&<div className="header-badge">⚡ Peak Hour</div>}
        </div>
      )}

      {selectMode&&(
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:15,padding:"0 14px",pointerEvents:"none"}}>
          <div style={{background:selectMode==="pickup"?"#4A7C6F":"#C45E3E",color:"#fff",borderRadius:12,padding:"10px 16px",textAlign:"center",fontSize:13,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,.2)"}}>
            {selectMode==="pickup"?"📍 Ketuk peta untuk lokasi jemput":"🏁 Ketuk peta untuk tujuan"}
          </div>
        </div>
      )}

      {tab==="home"&&(
        <div style={{position:"fixed",bottom:62,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:10,padding:"0 14px"}}>

          {step==="idle"&&(
            <div className="glass" style={{padding:16}}>
              <div style={{fontSize:10,color:T.ink3,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,fontWeight:600}}>Mau ke mana?</div>
              <div className={`input-wrap ${selectMode==="pickup"?"active":""}`} style={{marginBottom:8}}
                onClick={()=>{setSelectMode("pickup");setShowPopular(true);setPopularTarget("pickup")}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:T.sage,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div className="input-label">Lokasi jemput</div>
                  {pickupName?<div className="input-val">{pickupName}</div>:<div className="input-placeholder">Pilih lokasi atau ketuk peta</div>}
                </div>
                {pickup&&<span style={{fontSize:14,color:T.sage}}>✓</span>}
              </div>
              <div style={{width:1,height:8,background:T.cream3,margin:"0 0 0 18px"}}/>
              <div className={`input-wrap ${selectMode==="dest"?"active":""}`}
                onClick={()=>{setSelectMode("dest");setShowPopular(true);setPopularTarget("dest")}}>
                <div style={{width:8,height:8,borderRadius:2,background:T.terra,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div className="input-label">Tujuan</div>
                  {destName?<div className="input-val">{destName}</div>:<div className="input-placeholder">Pilih tujuan atau ketuk peta</div>}
                </div>
                {dest&&<span style={{fontSize:14,color:T.terra}}>✓</span>}
              </div>
              {pickup&&dest&&(
                <button className="btn-sage" style={{marginTop:12}} onClick={hitungTarif}>Lihat estimasi tarif →</button>
              )}
              {isPeak()&&(
                <div style={{marginTop:10,background:T.warnBg,border:"1px solid rgba(196,138,26,.2)",borderRadius:8,padding:"8px 12px",fontSize:11,color:T.warn,display:"flex",gap:6,alignItems:"center"}}>
                  <span>⚡</span><span>Peak hour aktif — tarif sedikit lebih tinggi</span>
                </div>
              )}
            </div>
          )}

          {step==="fare"&&fare&&(
            <div className="glass" style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,color:T.ink3,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Estimasi tarif</div>
                  <div style={{fontFamily:ff2,fontSize:30,fontWeight:700,color:T.terra}}>Rp {fare.toLocaleString("id-ID")}</div>
                  <div style={{fontSize:12,color:T.ink3,marginTop:2}}>{dist?.toFixed(1)} km · ~{Math.round((dist||0)/25*60)} menit</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:T.ink3,marginBottom:4}}>Maks vs Gojek</div>
                  <div style={{fontSize:11,fontWeight:600,color:T.sage}}>≤ +20% ✓</div>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:8}}>Tip untuk driver <span style={{color:T.ink3,fontWeight:400}}>(opsional)</span></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {TIPS.map(t=>(
                    <button key={t} className={`tip-btn ${tip===t?"active":""}`} onClick={()=>setTip(t)}>
                      {t===0?"Tanpa tip":`+Rp ${t.toLocaleString("id-ID")}`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{background:T.sageBg,border:"1px solid rgba(74,124,111,.2)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:T.ink2,fontWeight:500}}>Total bayar</span>
                <span style={{fontFamily:ff2,fontSize:22,fontWeight:700,color:T.sage}}>Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-ghost" style={{flex:1}} onClick={()=>setStep("idle")}>← Ubah</button>
                <button className="btn-terra" style={{flex:2}} onClick={pesanSekarang}>🛺 Pesan sekarang</button>
              </div>
            </div>
          )}

          {step==="searching"&&(
            <div className="glass" style={{padding:20,textAlign:"center"}}>
              <div className="spinner"/>
              <div style={{fontFamily:ff2,fontSize:15,fontWeight:700,color:T.ink,marginBottom:4}}>Mencari driver terdekat...</div>
              <div style={{fontSize:12,color:T.ink3}}>Mohon tunggu sebentar</div>
            </div>
          )}

          {step==="found"&&(
            <div className="glass" style={{padding:16}}>
              <div className="driver-card">
                <div style={{fontSize:30,marginBottom:8}}>🛺</div>
                <div style={{fontFamily:ff2,fontSize:17,fontWeight:700,marginBottom:4}}>Driver ditemukan!</div>
                <div style={{fontSize:13,opacity:.85,marginBottom:8}}>{driverName} · {driverEta} menit lagi</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <div className="pulse-dot"/>
                  <span style={{fontSize:11,opacity:.8}}>Sedang menuju lokasi jemput</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-ghost" style={{flex:1}}>📞 Hubungi</button>
                <button className="btn-sage" style={{flex:2}} onClick={()=>setStep("riding")}>✓ Oke, tunggu</button>
              </div>
            </div>
          )}

          {step==="riding"&&(
            <div className="glass" style={{padding:16}}>
              <div style={{fontSize:10,fontWeight:600,color:T.sage,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                <div className="pulse-dot"/><span>Perjalanan berlangsung</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:T.ink}}>{driverName}</div>
                  <div style={{fontSize:12,color:T.ink3}}>→ {destName}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:ff2,fontSize:20,fontWeight:700,color:T.terra}}>Rp {total.toLocaleString("id-ID")}</div>
                  {tip>0&&<div style={{fontSize:11,color:T.warn}}>incl. tip Rp {tip.toLocaleString("id-ID")}</div>}
                </div>
              </div>
              <button className="btn-sage" onClick={selesai}>✅ Selesai & beri rating</button>
            </div>
          )}
        </div>
      )}

      {showPopular&&(
        <div className="sheet-bg" onClick={()=>{setShowPopular(false);setSelectMode(null)}}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:T.cream3,margin:"0 auto 16px"}}/>
            <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.ink,marginBottom:4}}>
              {popularTarget==="pickup"?"Pilih lokasi jemput":"Pilih tujuan"}
            </div>
            <div style={{fontSize:12,color:T.ink3,marginBottom:14}}>Lokasi populer atau ketuk langsung di peta</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {POPULAR.map(p=>(
                <button key={p.name} onClick={()=>selectPopular(p,popularTarget)}
                  style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px",textAlign:"left",cursor:"pointer",fontFamily:ff}}>
                  <div style={{fontSize:20,marginBottom:6}}>{p.ic}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{p.name}</div>
                </button>
              ))}
            </div>
            <button className="btn-sage" onClick={()=>setShowPopular(false)}>📍 Ketuk peta untuk lokasi lain</button>
          </div>
        </div>
      )}

      {showRating&&(
        <div className="sheet-bg">
          <div className="sheet" style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>⭐</div>
            <div style={{fontFamily:ff2,fontSize:18,fontWeight:700,color:T.ink,marginBottom:4}}>Beri rating driver</div>
            <div style={{fontSize:13,color:T.ink3,marginBottom:20}}>{driverName}</div>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>submitRating(s)}
                  style={{fontSize:36,background:"none",border:"none",cursor:"pointer",transition:"transform .15s"}}
                  onMouseEnter={e=>(e.target.style.transform="scale(1.2)")}
                  onMouseLeave={e=>(e.target.style.transform="scale(1)")}>⭐</button>
              ))}
            </div>
            <button className="btn-ghost" style={{width:"100%"}} onClick={()=>submitRating(5)}>Lewati</button>
          </div>
        </div>
      )}

      {tab==="riwayat"&&(
        <div className="tab-page">
          <div style={{background:"linear-gradient(135deg,#2F5C52,#4A7C6F)",borderRadius:20,padding:"16px 18px",marginBottom:16,color:"#fff"}}>
            <div style={{fontSize:11,opacity:.75,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Koperasi Syarikat Islam</div>
            <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,marginBottom:2}}>Riwayat Perjalanan</div>
            <div style={{fontSize:11,opacity:.7}}>3 trip · Total Rp 62.000</div>
          </div>
          {[
            {dest:"Blok M",dist:"3.2",fare:15000,tip:5000,date:"Hari ini, 11:24",driver:"Ahmad R."},
            {dest:"Sudirman",dist:"5.8",fare:25000,tip:0,date:"Kemarin, 08:15",driver:"Budi S."},
            {dest:"Monas",dist:"2.1",fare:15000,tip:2000,date:"Senin, 16:40",driver:"Doni P."},
          ].map((r,i)=>(
            <div key={i} className="info-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:T.ink}}>→ {r.dest}</div>
                  <div style={{fontSize:11,color:T.ink3}}>{r.dist} km · {r.date} · {r.driver}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:ff2,fontSize:16,fontWeight:700,color:T.terra}}>Rp {(r.fare+r.tip).toLocaleString("id-ID")}</div>
                  {r.tip>0&&<div style={{fontSize:10,color:T.warn}}>+tip Rp {r.tip.toLocaleString("id-ID")}</div>}
                </div>
              </div>
              <div style={{paddingTop:6,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.sage}}>⭐⭐⭐⭐⭐ Perjalanan selesai</div>
            </div>
          ))}
        </div>
      )}

      {tab==="profil"&&(
        <div className="tab-page">
          <div style={{background:"linear-gradient(135deg,#2F5C52,#4A7C6F)",borderRadius:20,padding:"18px",marginBottom:16,display:"flex",gap:14,alignItems:"center",color:"#fff"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👤</div>
            <div>
              <div style={{fontFamily:ff2,fontSize:16,fontWeight:700}}>Penumpang</div>
              <div style={{fontSize:12,opacity:.75}}>penumpang@bajaj.com</div>
              <div style={{marginTop:6,background:"rgba(196,94,62,.8)",padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:600,display:"inline-block"}}>Member Koperasi</div>
            </div>
          </div>
          <div className="info-card">
            <div className="stat-row"><span style={{color:T.ink3}}>Total perjalanan</span><span style={{fontWeight:600}}>3 trip</span></div>
            <div className="stat-row"><span style={{color:T.ink3}}>Total pengeluaran</span><span style={{fontWeight:600}}>Rp 62.000</span></div>
            <div className="stat-row"><span style={{color:T.ink3}}>CO₂ dihemat</span><span style={{fontWeight:600,color:T.sage}}>~1.2 kg 🌿</span></div>
            <div className="stat-row"><span style={{color:T.ink3}}>Rating rata-rata</span><span style={{fontWeight:600}}>⭐ 5.0</span></div>
          </div>
          <div className="info-box-sage">🌿 Dengan naik bajaj listrik Koperasi Syarikat Islam, kamu berkontribusi mengurangi polusi Jakarta dan mendukung ekonomi kerakyatan!</div>
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
