"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

type Props = {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]; // กรุงเทพฯ

const PIN_HTML =
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="#2D5DA8">' +
  '<path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z"/>' +
  '<circle cx="12" cy="10" r="3" fill="#fff"/></svg>';

export function LeafletMap({ lat, lng, onPick, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const iconRef = useRef<L.DivIcon | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasPoint = lat != null && lng != null;
    const center: [number, number] = hasPoint ? [lat!, lng!] : DEFAULT_CENTER;
    const map = L.map(containerRef.current).setView(center, hasPoint ? 15 : 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: PIN_HTML,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
    iconRef.current = icon;

    if (hasPoint) markerRef.current = L.marker([lat!, lng!], { icon }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: la, lng: ln } = e.latlng;
      if (markerRef.current) markerRef.current.setLatLng([la, ln]);
      else markerRef.current = L.marker([la, ln], { icon }).addTo(map);
      onPickRef.current(la, ln);
    });

    mapRef.current = map;
    // แผนที่ render ในกล่องที่เพิ่ง mount — บังคับคำนวณขนาดใหม่กัน tile โหลดครึ่งเดียว
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      iconRef.current = null;
    };
  }, []);

  // sync ตำแหน่งจากภายนอก (เช่น กดใช้ตำแหน่งปัจจุบัน / เลือกที่บันทึกไว้)
  useEffect(() => {
    const map = mapRef.current;
    const icon = iconRef.current;
    if (!map || !icon || lat == null || lng == null) return;
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
  }, [lat, lng]);

  return <div ref={containerRef} className={className} />;
}
