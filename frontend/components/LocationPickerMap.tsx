'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, Marker, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

interface Props {
  lat: number
  lon: number
  onSelect: (lat: number, lon: number, address?: string) => void
}

// Custom Saffron Marker
const customMarker = L.divIcon({
  className: 'custom-saffron-marker',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
          <div style="position: absolute; width: 100%; height: 100%; background: rgba(245,78,0,0.3); border-radius: 50%; animation: pulse-dot 2s infinite;"></div>
          <div style="width: 14px; height: 14px; background-color: #f54e00; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(245,78,0,0.8); z-index: 2;"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Sub-component to handle map centering when coordinates change externally
function MapCenterer({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), { animate: true, duration: 1.5 })
  }, [lat, lon, map])
  return null
}

export default function LocationPickerMap({ lat, lon, onSelect }: Props) {
  const [pulsing, setPulsing] = useState(false)
  const markerRef = useRef<L.Marker>(null)

  // Handle click on map
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        handleCoordinateUpdate(e.latlng.lat, e.latlng.lng)
      },
    })
    return null
  }

  // Reverse geocode and update
  const handleCoordinateUpdate = async (newLat: number, newLon: number) => {
    // Trigger POI pulse animation
    setPulsing(true)
    setTimeout(() => setPulsing(false), 2000)

    try {
      // Reverse geocoding via Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLon}&zoom=18&addressdetails=1`)
      const data = await res.json()
      const addr = data.address
      // Format a concise address
      const formattedAddress = [
        addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town
      ].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 3).join(', ')
      
      onSelect(newLat, newLon, formattedAddress)
    } catch (error) {
      console.error('Reverse geocoding failed', error)
      onSelect(newLat, newLon) // Fallback without address
    }
  }

  // Mock multiplier logic based on coords
  const tierMock = (lat + lon) % 2 > 1 ? { tier: 'Elite', mult: '1.45x' } : { tier: 'Standard', mult: '1.05x' }

  return (
    <div className="relative w-full h-[300px] rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(245,78,0,0.05)] border border-[var(--hairline)] bg-[var(--surface)]">
      
      {/* Live Coordinate Card Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1 pointer-events-none">
        <div className="backdrop-blur-xl bg-[#1c1b17]/90 border border-white/10 px-3 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-white">
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-300">{tierMock.tier}</span>
            <span className="text-[10px] font-bold text-[var(--primary)] bg-[rgba(245,78,0,0.15)] px-1.5 rounded">
              {tierMock.mult}
            </span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom
        zoomControl={false}
        className="w-full h-full z-0"
      >
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />

        {/* 500m Catchment Area */}
        <Circle 
          center={[lat, lon]} 
          radius={500}
          pathOptions={{ 
            color: 'rgba(245,78,0,0.4)', 
            fillColor: '#f54e00', 
            fillOpacity: 0.08,
            weight: 1,
            dashArray: '4 4'
          }}
        />

        {/* POI Pulse Ring */}
        {pulsing && (
          <Circle
            center={[lat, lon]}
            radius={150}
            pathOptions={{
              color: '#f54e00',
              fillColor: 'transparent',
              weight: 2,
              className: 'poi-pulse-ring'
            }}
          />
        )}

        {/* Draggable Marker */}
        <Marker 
          position={[lat, lon]} 
          icon={customMarker}
          draggable={true}
          ref={markerRef}
          eventHandlers={{
            dragend: () => {
              const marker = markerRef.current
              if (marker != null) {
                const newPos = marker.getLatLng()
                handleCoordinateUpdate(newPos.lat, newPos.lng)
              }
            }
          }}
        />

        <MapCenterer lat={lat} lon={lon} />
        <MapClickHandler />
      </MapContainer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes poi-pulse {
          0% { stroke-dashoffset: 200; opacity: 1; stroke-width: 3; }
          100% { stroke-dashoffset: 0; opacity: 0; stroke-width: 0; }
        }
        .poi-pulse-ring {
          stroke-dasharray: 20;
          animation: poi-pulse 1s ease-out infinite;
        }
      `}} />
    </div>
  )
}
