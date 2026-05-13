"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { theme } from "@/lib/theme"

const icon = L.divIcon({
  className: "",
  html: `<div style="
    width: 12px; height: 12px;
    background: ${theme.primary};
    border: 2.5px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 14) }, [lat, lng, map])
  return null
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    )
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export default function LocationMap({
  address, city, country
}: { address?: string | null; city?: string | null; country?: string | null }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const queries = [
      [address, city, country].filter(Boolean).join(", "),
      [city, country].filter(Boolean).join(", "),
      city,
    ].filter(Boolean) as string[]

    let cancelled = false
    ;(async () => {
      for (const q of queries) {
        const result = await geocode(q)
        if (cancelled) return
        if (result) { setCoords(result); return }
      }
      if (!cancelled) setFailed(true)
    })()
    return () => { cancelled = true }
  }, [address, city, country])

  if (failed) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <span className="text-xs text-gray-400">Map unavailable</span>
      </div>
    )
  }

  if (!coords) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <span className="text-xs text-gray-300">Loading map…</span>
      </div>
    )
  }

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={14}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
      <Marker position={[coords.lat, coords.lng]} icon={icon} />
      <RecenterMap lat={coords.lat} lng={coords.lng} />
    </MapContainer>
  )
}
