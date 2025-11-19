'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ParkFeatureCollection } from '@/types';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapViewProps {
  parks: ParkFeatureCollection | null;
  onParkClick?: (parkId: string) => void;
  selectedParkId?: string | null;
}

export default function MapView({ parks, onParkClick, selectedParkId }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const hoveredParkId = useRef<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Try to get user's location
    const initializeMap = (center: [number, number], zoom: number) => {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center,
        zoom,
        attributionControl: false,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.AttributionControl({
          compact: true,
        })
      );

      map.current.on('load', () => {
        setIsMapLoaded(true);
      });
    };

    // Get user's geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // User's location
          initializeMap(
            [position.coords.longitude, position.coords.latitude],
            12
          );
        },
        () => {
          // Fallback to default location
          initializeMap([-98, 38.5], 4);
        }
      );
    } else {
      // Fallback if geolocation not supported
      initializeMap([-98, 38.5], 4);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update parks layer
  useEffect(() => {
    if (!map.current || !isMapLoaded || !parks) return;

    // Remove existing layers and sources
    if (map.current.getLayer('parks-fill')) {
      map.current.removeLayer('parks-fill');
    }
    if (map.current.getLayer('parks-hover')) {
      map.current.removeLayer('parks-hover');
    }
    if (map.current.getLayer('parks-outline')) {
      map.current.removeLayer('parks-outline');
    }
    if (map.current.getLayer('parks-selected')) {
      map.current.removeLayer('parks-selected');
    }
    if (map.current.getSource('parks')) {
      map.current.removeSource('parks');
    }

    if (!parks.features || parks.features.length === 0) return;

    // Parse and validate GeoJSON data
    const validFeatures = parks.features.map((feature) => {
      // Check if geometry is a string (needs parsing)
      let geometry = feature.geometry;
      if (typeof geometry === 'string') {
        try {
          geometry = JSON.parse(geometry);
        } catch (e) {
          console.error('Failed to parse geometry:', e);
          return null;
        }
      }

      return {
        type: 'Feature' as const,
        geometry,
        properties: {
          ...feature.properties,
          id: feature.properties.Park_id || feature.properties.gid?.toString() || feature.properties.id,
          name: feature.properties.Park_Name || feature.properties.name,
        },
      };
    }).filter((feature): feature is NonNullable<typeof feature> => {
      return (
        feature !== null &&
        feature.geometry &&
        feature.geometry.type &&
        feature.geometry.coordinates &&
        feature.properties
      );
    });

    if (validFeatures.length === 0) {
      console.error('No valid features in park data');
      console.log('Total features received:', parks.features.length);
      return;
    }

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: validFeatures,
    };

    try {
      // Add source
      map.current.addSource('parks', {
        type: 'geojson',
        data: geojsonData as any,
      });
    } catch (error) {
      console.error('Error adding GeoJSON source:', error);
      console.log('GeoJSON data:', JSON.stringify(geojsonData, null, 2));
      return;
    }

    // Add fill layer
    map.current.addLayer({
      id: 'parks-fill',
      type: 'fill',
      source: 'parks',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'id'], selectedParkId || ''],
          '#7dd3fc', // Selected: Light blue
          '#4ade80' // Default: Medium green (darker)
        ],
        'fill-opacity': [
          'case',
          ['==', ['get', 'id'], selectedParkId || ''],
          0.8,
          0.75
        ],
      },
    });

    // Add hover layer
    map.current.addLayer({
      id: 'parks-hover',
      type: 'fill',
      source: 'parks',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'id'], selectedParkId || ''],
          '#38bdf8', // Selected + Hover: Bright blue
          '#22c55e' // Hover: Vibrant green (darker)
        ],
        'fill-opacity': 0,
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'parks-outline',
      type: 'line',
      source: 'parks',
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'id'], selectedParkId || ''],
          '#0ea5e9', // Selected: Sky blue
          '#22c55e' // Default: Vibrant green
        ],
        'line-width': [
          'case',
          ['==', ['get', 'id'], selectedParkId || ''],
          3,
          2
        ],
        'line-opacity': [
          'case',
          ['==', ['get', 'id'], selectedParkId || ''],
          1,
          0.8
        ],
      },
    });

    // Fit bounds to parks
    const bounds = new mapboxgl.LngLatBounds();
    validFeatures.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach((coord: number[]) => {
          bounds.extend(coord as [number, number]);
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon[0].forEach((coord: number[]) => {
            bounds.extend(coord as [number, number]);
          });
        });
      }
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }

    // Add click handler
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['parks-fill'],
      });

      if (features && features.length > 0 && onParkClick) {
        const parkId = features[0].properties?.id;
        if (parkId) {
          onParkClick(parkId);
        }
      }
    };

    map.current.on('click', 'parks-fill', handleClick);

    // Initialize popup if not already created
    if (!popup.current) {
      popup.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        className: 'park-info-popup'
      });
    }

    // Change cursor and show popup on hover
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['parks-fill'],
      });

      if (features && features.length > 0) {
        const feature = features[0];
        const properties = feature.properties;
        const currentParkId = properties?.id;

        // Update hover effect
        if (currentParkId && currentParkId !== hoveredParkId.current) {
          // Remove previous hover
          if (hoveredParkId.current) {
            map.current?.setFeatureState(
              { source: 'parks', id: hoveredParkId.current },
              { hover: false }
            );
          }

          hoveredParkId.current = currentParkId;

          // Apply hover effect
          map.current?.setPaintProperty('parks-hover', 'fill-opacity', [
            'case',
            ['==', ['get', 'id'], currentParkId],
            0.3,
            0
          ]);

          // Build popup HTML with available properties
          const parkName = properties?.Park_Name || properties?.name || 'Unknown Park';
          const parkOwner = properties?.Park_Owner || properties?.owner || properties?.Owner || 'N/A';

          // Log all properties to help debug
          console.log('Park properties:', properties);

          // Try multiple property name variations for address
          const address = properties?.Park_Addre ||
                         properties?.Address ||
                         properties?.address ||
                         properties?.park_addre ||
                         properties?.Street ||
                         properties?.street ||
                         properties?.street_address ||
                         properties?.STREET ||
                         properties?.ADDRESS ||
                         'N/A';

          // Try multiple property name variations for zip code
          const zipCode = properties?.Park_Zip ||
                         properties?.park_zip ||
                         properties?.Zip_Code ||
                         properties?.zip_code ||
                         properties?.zipcode ||
                         properties?.ZIP ||
                         properties?.zip ||
                         properties?.ZIPCODE ||
                         properties?.postal_code ||
                         properties?.postalcode ||
                         'N/A';

          const popupHTML = `
            <div style="padding: 12px; min-width: 220px; background: white; border-radius: 8px;">
              <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #047857; border-bottom: 2px solid #d1fae5; padding-bottom: 6px;">${parkName}</div>
              <div style="font-size: 13px; line-height: 1.8; color: #374151;">
                <div style="margin-bottom: 4px; display: flex;">
                  <span style="font-weight: 600; color: #065f46; min-width: 70px;">Owner:</span>
                  <span style="color: #1f2937;">${parkOwner}</span>
                </div>
                <div style="margin-bottom: 4px; display: flex;">
                  <span style="font-weight: 600; color: #065f46; min-width: 70px;">Address:</span>
                  <span style="color: #1f2937; flex: 1;">${address}</span>
                </div>
                <div style="display: flex;">
                  <span style="font-weight: 600; color: #065f46; min-width: 70px;">Zip Code:</span>
                  <span style="color: #1f2937;">${zipCode}</span>
                </div>
              </div>
            </div>
          `;

          popup.current?.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map.current!);
        } else if (popup.current?.isOpen()) {
          // Just update position if hovering over the same park
          popup.current.setLngLat(e.lngLat);
        }
      }
    };

    map.current.on('mouseenter', 'parks-fill', (e) => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
        handleMouseMove(e);
      }
    });

    map.current.on('mousemove', 'parks-fill', handleMouseMove);

    map.current.on('mouseleave', 'parks-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
        popup.current?.remove();
        hoveredParkId.current = null;

        // Reset hover effect
        map.current.setPaintProperty('parks-hover', 'fill-opacity', 0);
      }
    });

    return () => {
      if (map.current) {
        map.current.off('click', 'parks-fill', handleClick);
        map.current.off('mousemove', 'parks-fill', handleMouseMove);
      }
      popup.current?.remove();
    };
  }, [parks, isMapLoaded, selectedParkId, onParkClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
