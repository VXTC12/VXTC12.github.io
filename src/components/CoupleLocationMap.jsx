import { useEffect, useRef } from 'react'
import { Crosshair, MapPinned } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useSignedPhoto from '../hooks/useSignedPhoto'

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character])
}

function personIcon(displayName, avatarUrl, type) {
  const name = displayName || (type === 'me' ? '我' : '另一半')
  const safeName = escapeHtml(name)
  const avatar = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="" />`
    : `<span>${escapeHtml(name.slice(0, 1))}</span>`

  return L.divIcon({
    className: 'couple-map-person-icon',
    html: `<div class="couple-map-marker couple-map-marker--${type}">
      <div class="couple-map-marker__avatar">${avatar}</div>
      <b>${type === 'me' ? '我' : 'TA'} · ${safeName}</b>
    </div>`,
    iconSize: [96, 88],
    iconAnchor: [48, 58],
  })
}

function distanceIcon(distanceLabel) {
  return L.divIcon({
    className: 'couple-map-distance-icon',
    html: `<span>${escapeHtml(distanceLabel)}</span>`,
    iconSize: [116, 34],
    iconAnchor: [58, 17],
  })
}

function fitTwoPeople(map, firstPoint, secondPoint, distance) {
  if (distance !== null && distance < 80) {
    map.setView(firstPoint, 16, { animate: true })
    return
  }

  const bounds = L.latLngBounds(firstPoint, secondPoint)
  map.fitBounds(bounds, { padding: [64, 64], maxZoom: 15, animate: true })
}

export default function CoupleLocationMap({ myLocation, partnerLocation, distance, distanceLabel }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const myAvatar = useSignedPhoto(myLocation?.avatar_path, '')
  const partnerAvatar = useSignedPhoto(partnerLocation?.avatar_path, '')
  const hasBothLocations = Boolean(myLocation && partnerLocation)
  const myLatitude = myLocation?.latitude
  const myLongitude = myLocation?.longitude
  const myAccuracy = myLocation?.accuracy
  const myName = myLocation?.display_name
  const partnerLatitude = partnerLocation?.latitude
  const partnerLongitude = partnerLocation?.longitude
  const partnerAccuracy = partnerLocation?.accuracy
  const partnerName = partnerLocation?.display_name

  useEffect(() => {
    if (!hasBothLocations || !containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      attributionControl: true,
      scrollWheelZoom: true,
      touchZoom: true,
      zoomControl: true,
    })
    mapRef.current = map
    map.zoomControl.setPosition('bottomright')

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map)

    const myPoint = [myLatitude, myLongitude]
    const partnerPoint = [partnerLatitude, partnerLongitude]

    if (myAccuracy > 0) {
      L.circle(myPoint, {
        radius: myAccuracy,
        color: '#b96570',
        weight: 1,
        fillColor: '#efd1d5',
        fillOpacity: 0.22,
      }).addTo(map)
    }
    if (partnerAccuracy > 0) {
      L.circle(partnerPoint, {
        radius: partnerAccuracy,
        color: '#8f745f',
        weight: 1,
        fillColor: '#e7d8c7',
        fillOpacity: 0.25,
      }).addTo(map)
    }

    L.polyline([myPoint, partnerPoint], {
      color: '#a84f5c',
      dashArray: '8 10',
      lineCap: 'round',
      opacity: 0.9,
      weight: 3,
    }).addTo(map)

    L.marker(myPoint, { icon: personIcon(myName, myAvatar, 'me'), zIndexOffset: 200 }).addTo(map)
    L.marker(partnerPoint, { icon: personIcon(partnerName, partnerAvatar, 'partner'), zIndexOffset: 200 }).addTo(map)

    const midpoint = [
      (myLatitude + partnerLatitude) / 2,
      (myLongitude + partnerLongitude) / 2,
    ]
    L.marker(midpoint, {
      icon: distanceIcon(distanceLabel),
      interactive: false,
      zIndexOffset: 100,
    }).addTo(map)

    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)
    fitTwoPeople(map, myPoint, partnerPoint, distance)
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100)

    return () => {
      window.clearTimeout(resizeTimer)
      mapRef.current = null
      map.remove()
    }
  }, [
    distance,
    distanceLabel,
    hasBothLocations,
    myAvatar,
    myAccuracy,
    myLatitude,
    myLongitude,
    myName,
    partnerAvatar,
    partnerAccuracy,
    partnerLatitude,
    partnerLongitude,
    partnerName,
  ])

  if (!hasBothLocations) {
    return (
      <div className="couple-map-placeholder">
        <MapPinned size={34} />
        <strong>两个人共享位置后，地图会在这里出现</strong>
        <span>地图不会显示具体坐标，只显示头像、相对位置和直线距离。</span>
      </div>
    )
  }

  return (
    <div className="couple-map-shell">
      <div ref={containerRef} className="couple-map" aria-label="显示两个人位置和直线距离的互动地图" />
      <button
        type="button"
        className="couple-map-fit"
        onClick={() => mapRef.current && fitTwoPeople(
          mapRef.current,
          [myLatitude, myLongitude],
          [partnerLatitude, partnerLongitude],
          distance,
        )}
        aria-label="在地图中重新显示两个人的位置"
      >
        <Crosshair size={17} /> 显示双方
      </button>
      <p className="couple-map-tip">双指缩放 · 单指拖动 · 圆圈表示定位精度</p>
    </div>
  )
}
