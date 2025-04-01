import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  onClick?: (latlng: { lat: number; lng: number }) => void;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    id?: number;
  }>;
  height?: string;
  width?: string;
}

const LeafletMap: React.FC<MapProps> = ({
  center = [-23.9666, -46.3833], // Default center (Santos, Brazil)
  zoom = 13,
  onClick,
  markers = [],
  height = '400px',
  width = '100%',
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [currentMarker, setCurrentMarker] = useState<L.Marker | null>(null);
  
  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add click handler if provided
      if (onClick) {
        mapRef.current.on('click', (e) => {
          onClick(e.latlng);
          
          // Remove existing temporary marker if exists
          if (currentMarker) {
            mapRef.current?.removeLayer(currentMarker);
          }
          
          // Add new marker
          const newMarker = L.marker(e.latlng).addTo(mapRef.current!);
          setCurrentMarker(newMarker);
        });
      }
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (mapRef.current) {
      // Clear existing markers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      // Add new markers
      markers.forEach((marker) => {
        const leafletMarker = L.marker(marker.position).addTo(mapRef.current!);
        if (marker.popup) {
          leafletMarker.bindPopup(marker.popup);
        }
      });
    }
  }, [markers]);

  // Update center and zoom when they change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div ref={mapContainerRef} style={{ height, width }} className="rounded-md" />
  );
};

export default LeafletMap;
