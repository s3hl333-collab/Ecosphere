'use client';

import React, { useEffect, useEffectEvent, useRef, useState, useCallback, useId } from 'react';
import type * as Leaflet from 'leaflet';
import {
  WasteBin,
  RecyclingFacility,
  Waterbody,
  AQIMeasurement,
  TrafficObservation,
  Complaint,
} from '@/lib/types';
import {
  MapPin,
  Trash2,
  Droplet,
  Wind,
  Car,
  AlertTriangle,
  Locate,
  ZoomIn,
  ZoomOut,
  Info,
  X,
  Sun,
  Moon,
  Compass,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Layers,
  Globe,
  Satellite,
  HelpCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

const GUWAHATI_COORDS: [number, number] = [26.1445, 91.7362];
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface MapComponentProps {
  wasteBins: WasteBin[];
  recyclingFacilities: RecyclingFacility[];
  waterbodies: Waterbody[];
  aqiStations: AQIMeasurement[];
  trafficObservations: TrafficObservation[];
  complaints: Complaint[];
  interactive?: boolean;
  selectedLocation?: [number, number]; // [lng, lat]
  onLocationSelect?: (coords: [number, number]) => void;
  heightClass?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  wasteBins = [],
  recyclingFacilities = [],
  waterbodies = [],
  aqiStations = [],
  trafficObservations = [],
  complaints = [],
  interactive = true,
  selectedLocation,
  onLocationSelect,
  heightClass = 'h-[520px] sm:h-[720px] lg:h-[800px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map>(null);
  const leafletLibRef = useRef<typeof Leaflet>(null);
  const baseTileLayerRef = useRef<Leaflet.TileLayer>(null);
  const labelsTileLayerRef = useRef<Leaflet.TileLayer>(null);
  const layersGroupRef = useRef<Leaflet.LayerGroup>(null);
  const userMarkerRef = useRef<Leaflet.Marker>(null);
  const explanation = useRef<HTMLDialogElement>(null);
  const explanationTitle = useId();
  const backgroundId = useId();

  // Basemap View: 'satellite' (Default) | 'hybrid' | 'dark' | 'streets'
  const [basemapMode, setBasemapMode] = useState<'satellite' | 'hybrid' | 'dark' | 'streets'>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tileLoadError, setTileLoadError] = useState(false);
  const [mapError, setMapError] = useState('');
  const selectMapLocation = useEffectEvent((coords: [number, number]) => onLocationSelect?.(coords));

  // Active Environmental Data Layers
  const [layers, setLayers] = useState({
    bioBins: true,
    nonBioBins: true,
    recycling: true,
    waterbodies: true,
    aqi: true,
    traffic: true,
    complaints: true,
  });

  // Active Inspector Drawer
  const [activeInspector, setActiveInspector] = useState<{
    type: string;
    title: string;
    badge: string;
    badgeVariant: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
    subtitle?: string;
    imageUrl?: string;
    metrics: { label: string; value: string }[];
    description?: string;
    prototypeNotice?: string;
    actionLink?: { href: string; label: string };
  } | null>(null);

  // Hotspots for Rapid Navigation
  const HOTSPOTS = [
    { name: 'Bharalu Canal (DO 0.8)', lat: 26.1741, lng: 91.7342, zoom: 15 },
    { name: 'GS Road (Heavy Traffic)', lat: 26.1589, lng: 91.7761, zoom: 15 },
    { name: 'Pan Bazar (Air Station)', lat: 26.1852, lng: 91.7471, zoom: 15 },
    { name: 'Deepor Beel (Wetland)', lat: 26.1287, lng: 91.6625, zoom: 14 },
    { name: 'Jalukbari Rotary (Exhaust)', lat: 26.1568, lng: 91.6841, zoom: 15 },
    { name: 'Fancy Bazar (Bio/Dry Bins)', lat: 26.1856, lng: 91.7412, zoom: 16 },
  ];

  // Apply Tile Layer to Map
  const applyTileLayer = useCallback((L: typeof Leaflet, map: Leaflet.Map, mode: 'satellite' | 'hybrid' | 'dark' | 'streets') => {
    if (!L || !map) return;

    if (baseTileLayerRef.current) {
      try {
        map.removeLayer(baseTileLayerRef.current);
      } catch (e) {
        // Ignore removal error
      }
      baseTileLayerRef.current = null;
    }

    if (labelsTileLayerRef.current) {
      try {
        map.removeLayer(labelsTileLayerRef.current);
      } catch (e) {
        // Ignore removal error
      }
      labelsTileLayerRef.current = null;
    }

    setTileLoadError(false);

    try {
      if (mode === 'satellite' || mode === 'hybrid') {
        // High-Resolution Photorealistic Satellite Imagery from Esri World Imagery (No API key needed)
        const satLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution: 'Esri World Imagery',
            crossOrigin: true,
          }
        );

        satLayer.on('tileerror', () => {
          setTileLoadError(true);
        });

        satLayer.addTo(map);
        baseTileLayerRef.current = satLayer;

        // If Hybrid mode, add boundary and street label overlay
        if (mode === 'hybrid') {
          const labelLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              opacity: 0.9,
              crossOrigin: true,
            }
          );
          labelLayer.addTo(map);
          labelsTileLayerRef.current = labelLayer;
        }
      } else if (mode === 'dark') {
        // Dark Architectural Cartography (Zero API key needed)
        const darkLayer = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; CARTO',
          }
        );
        darkLayer.addTo(map);
        darkLayer.on('tileerror', () => setTileLoadError(true));
        baseTileLayerRef.current = darkLayer;
      } else {
        // Light Cartography (Zero API key needed)
        const lightLayer = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; CARTO',
          }
        );
        lightLayer.addTo(map);
        lightLayer.on('tileerror', () => setTileLoadError(true));
        baseTileLayerRef.current = lightLayer;
      }
    } catch (err) {
      setTileLoadError(true);
    }
  }, []);

  // Render Environmental Elements
  const renderEnvironmentalLayers = useCallback((L: typeof Leaflet, group: Leaflet.LayerGroup) => {
    group.clearLayers();

    // 1. Biodegradable Bins (Emerald with BIO Badge)
    if (layers.bioBins) {
      wasteBins
        .filter((b) => b.category === 'biodegradable')
        .forEach((b) => {
          const icon = L.divIcon({
            className: 'custom-bin-bio',
            html: `
              <div class="relative flex items-center justify-center cursor-pointer group touch-manipulation">
                <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40"></span>
                <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white transition-transform group-hover:scale-125">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
                <span class="absolute -bottom-2 bg-emerald-700 text-white font-mono text-[8px] font-bold px-1 rounded shadow-xs">BIO</span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([b.coordinates[1], b.coordinates[0]], { icon, title: `Biodegradable bin: ${b.address}` }).addTo(group);
          marker.on('click', () => {
            setActiveInspector({
              type: 'MUNICIPAL INFRASTRUCTURE',
              title: 'Biodegradable Organic Dustbin',
              badge: 'GREEN BIN (WET WASTE)',
              badgeVariant: 'green',
              subtitle: b.address,
              metrics: [
                { label: 'Volume Capacity', value: `${b.capacityLiters} L` },
                { label: 'Fill Status', value: b.fillStatus.toUpperCase() },
                { label: 'Coordinates', value: `${b.coordinates[1].toFixed(4)}, ${b.coordinates[0].toFixed(4)}` },
                { label: 'Sanitation Division', value: b.verifiedBy },
              ],
              description: 'Exclusively intended for compostable kitchen waste, fruit/vegetable discards, and biological matter.',
              prototypeNotice: 'Guwahati Municipal Corporation Ward Demonstration Record',
            });
          });
        });
    }

    // 2. Non-Biodegradable Bins (Electric Sky Blue with DRY Badge)
    if (layers.nonBioBins) {
      wasteBins
        .filter((b) => b.category === 'non_biodegradable')
        .forEach((b) => {
          const icon = L.divIcon({
            className: 'custom-bin-dry',
            html: `
              <div class="relative flex items-center justify-center cursor-pointer group touch-manipulation">
                <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-40"></span>
                <div class="w-8 h-8 rounded-full bg-sky-600 border-2 border-white shadow-xl flex items-center justify-center text-white transition-transform group-hover:scale-125">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
                <span class="absolute -bottom-2 bg-sky-700 text-white font-mono text-[8px] font-bold px-1 rounded shadow-xs">DRY</span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([b.coordinates[1], b.coordinates[0]], { icon, title: `Non-biodegradable bin: ${b.address}` }).addTo(group);
          marker.on('click', () => {
            setActiveInspector({
              type: 'MUNICIPAL INFRASTRUCTURE',
              title: 'Non-Biodegradable Recyclables Dustbin',
              badge: 'BLUE BIN (DRY WASTE)',
              badgeVariant: 'blue',
              subtitle: b.address,
              metrics: [
                { label: 'Volume Capacity', value: `${b.capacityLiters} L` },
                { label: 'Fill Status', value: b.fillStatus.toUpperCase() },
                { label: 'Coordinates', value: `${b.coordinates[1].toFixed(4)}, ${b.coordinates[0].toFixed(4)}` },
                { label: 'Inspection Agency', value: b.verifiedBy },
              ],
              description: 'Designed for dry recyclables: PET bottles, clean plastics, aluminum cans, glass, and paper.',
              prototypeNotice: 'Guwahati Municipal Corporation Ward Demonstration Record',
            });
          });
        });
    }

    // 3. Polluted Rivers & Waterbodies (Flow Polylines on Satellite Surface)
    if (layers.waterbodies) {
      waterbodies.forEach((w) => {
        if (w.polylineCoordinates && w.polylineCoordinates.length > 1) {
          const latLngs = w.polylineCoordinates.map((pt) => [pt[1], pt[0]] as [number, number]);

          const color =
            w.pollutionLevel === 'critical'
              ? '#DC2626'
              : w.pollutionLevel === 'severe'
              ? '#EA580C'
              : '#0284C7';

          const polyline = L.polyline(latLngs, {
            color,
            weight: 6,
            opacity: 0.9,
            dashArray: w.pollutionLevel === 'critical' ? '8, 8' : undefined,
          }).addTo(group);

          polyline.on('click', () => {
            setActiveInspector({
              type: 'HYDROLOGICAL CORRIDOR',
              title: w.name,
              badge: `${w.pollutionLevel.toUpperCase()} POLLUTION (DO: ${w.dissolvedOxygenMgL ?? 0.8} mg/L)`,
              badgeVariant: w.pollutionLevel === 'critical' ? 'red' : 'yellow',
              subtitle: `${w.waterbodyType.toUpperCase()} &bull; Guwahati Drainage Basin`,
              metrics: [
                { label: 'Dissolved Oxygen (DO)', value: `${w.dissolvedOxygenMgL ?? 'N/A'} mg/L` },
                { label: 'Biochem. Oxygen Demand (BOD)', value: `${w.bodMgL ?? 'N/A'} mg/L` },
                { label: 'Primary Stressors', value: w.primaryPollutants?.join(', ') || 'Untreated solid waste' },
                { label: 'Data Source', value: w.dataSource || 'SPCB Assam' },
              ],
              description: `Critical hydrological basin in Guwahati. Unsegregated plastic dumps and organic sludge lead to severe dissolved oxygen depletion.`,
              prototypeNotice: 'Pollution thresholds calibrated against SPCB Assam water quality monitoring stations.',
            });
          });
        }

        // River Centroid Marker
        const icon = L.divIcon({
          className: 'custom-waterbody',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group touch-manipulation">
              <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full ${w.pollutionLevel === 'critical' ? 'bg-rose-500' : 'bg-sky-400'} opacity-60"></span>
              <div class="w-8 h-8 rounded-full ${w.pollutionLevel === 'critical' ? 'bg-rose-600' : 'bg-sky-600'} border-2 border-white shadow-xl flex items-center justify-center text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([w.coordinates[1], w.coordinates[0]], { icon, title: w.name }).addTo(group);
        marker.on('click', () => {
          setActiveInspector({
            type: 'HYDROLOGICAL CORRIDOR',
            title: w.name,
            badge: `${w.pollutionLevel.toUpperCase()} POLLUTION (DO: ${w.dissolvedOxygenMgL ?? 0.8} mg/L)`,
            badgeVariant: w.pollutionLevel === 'critical' ? 'red' : 'yellow',
            subtitle: `${w.waterbodyType.toUpperCase()} &bull; Guwahati Drainage Basin`,
            metrics: [
              { label: 'Dissolved Oxygen (DO)', value: `${w.dissolvedOxygenMgL ?? 'N/A'} mg/L` },
              { label: 'Biochem. Oxygen Demand (BOD)', value: `${w.bodMgL ?? 'N/A'} mg/L` },
              { label: 'Primary Stressors', value: w.primaryPollutants?.join(', ') || 'Solid waste' },
              { label: 'Testing Agency', value: w.dataSource || 'SPCB Assam' },
            ],
            description: `Key waterbody in Kamrup Metropolitan. Dissolved oxygen levels indicate anaerobic conditions near uncollected waste discharge points.`,
            prototypeNotice: 'Thresholds modeled after regional Assam water monitoring stations.',
          });
        });
      });
    }

    // 4. Traffic Pollution Corridors (Emissions Plumes)
    if (layers.traffic) {
      trafficObservations.forEach((t) => {
        const coords = t.coordinates;
        if (coords && coords.length > 1) {
          const latLngs = coords.map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);

          const color =
            t.congestionLevel === 'heavy' || t.congestionLevel === 'severe'
              ? '#EF4444'
              : t.congestionLevel === 'moderate'
              ? '#F59E0B'
              : '#10B981';

          const trafficLine = L.polyline(latLngs, {
            color,
            weight: 7,
            opacity: 0.85,
          }).addTo(group);

          trafficLine.on('click', () => {
            setActiveInspector({
              type: 'VEHICULAR EMISSION CORRIDOR',
              title: t.roadName,
              badge: `${t.congestionLevel.toUpperCase()} CONGESTION`,
              badgeVariant: t.congestionLevel === 'heavy' || t.congestionLevel === 'severe' ? 'red' : 'yellow',
              subtitle: 'Tailpipe Emission Surge Analysis',
              metrics: [
                { label: 'Average Speed', value: `${t.averageSpeedKmh} km/h` },
                { label: 'Pollution Index', value: t.airPollutionIndex || 'High' },
                { label: 'Emission Impact', value: t.emissionImpact || 'Elevated localized PM2.5' },
                { label: 'Updated At', value: new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ],
              description: `High vehicle idling along ${t.roadName || 'corridor'} correlates directly with localized air pollution spikes and nitrogen dioxide elevation.`,
              prototypeNotice: 'Synthetic traffic telemetry calibrated to regional vehicular bottlenecks.',
            });
          });
        }
      });
    }

    // 5. NAQI Atmospheric Monitoring Stations
    if (layers.aqi) {
      aqiStations.forEach((a) => {
        const color =
          a.category === 'Poor'
            ? '#DC2626'
            : a.category === 'Moderate'
            ? '#D97706'
            : '#10B981';

        // Atmospheric Dispersion Radius Ring
        L.circle([a.coordinates[1], a.coordinates[0]], {
          radius: 900,
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 6',
        }).addTo(group);

        // Station Badge Marker
        const icon = L.divIcon({
          className: 'custom-aqi',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group touch-manipulation">
              <div class="px-2 py-1 rounded-md ${color === '#DC2626' ? 'bg-rose-600' : color === '#D97706' ? 'bg-amber-600' : 'bg-emerald-600'} border-2 border-white shadow-2xl text-white font-mono text-[10px] font-bold transition-transform group-hover:scale-120 flex items-center gap-1">
                <span>${a.aqiValue}</span>
                <span class="text-[7px] uppercase font-sans opacity-85">NAQI</span>
              </div>
            </div>
          `,
          iconSize: [48, 28],
          iconAnchor: [24, 14],
        });

        const marker = L.marker([a.coordinates[1], a.coordinates[0]], { icon, title: a.stationName }).addTo(group);
        marker.on('click', () => {
          setActiveInspector({
            type: 'ATMOSPHERIC OBSERVATORY',
            title: a.stationName,
            badge: `${a.category.toUpperCase()} AIR QUALITY`,
            badgeVariant: a.category === 'Poor' ? 'red' : a.category === 'Moderate' ? 'yellow' : 'green',
            subtitle: a.aqiScale,
            metrics: [
              { label: 'National AQI Score', value: `${a.aqiValue}` },
              { label: 'Fine PM2.5', value: `${a.pm25} µg/m³` },
              { label: 'Coarse PM10', value: `${a.pm10} µg/m³` },
              { label: 'Dominant Pollutant', value: a.dominantPollutant },
            ],
            description: `Health guidance: ${
              a.aqiValue > 200
                ? 'Unhealthy for sensitive individuals and active citizens. High localized dust and vehicular tailpipe particulates.'
                : 'Moderate air condition. Outdoor exposure acceptable for general public.'
            }`,
            prototypeNotice: a.sourceLabel,
          });
        });
      });
    }

    // 6. Junkyards & Recycling Centers
    if (layers.recycling) {
      recyclingFacilities.forEach((f) => {
        const icon = L.divIcon({
          className: 'custom-recycler',
          html: `
            <div class="absolute left-1.5 bottom-1.5 w-8 h-8 rounded-full bg-amber-700 border-2 border-white shadow-xl flex items-center justify-center text-white cursor-pointer transition-transform touch-manipulation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"></path><path d="M11 19h8.2a1.8 1.8 0 0 0 1.558-.9 1.8 1.8 0 0 0 0-1.8L16.8 9.5"></path><path d="M9.5 5.5 12 2l2.5 3.5"></path><path d="M14 9a2 2 0 0 1-2 2H8"></path></svg>
            </div>
          `,
          iconSize: [44, 54],
          iconAnchor: [22, 32],
        });

        const marker = L.marker([f.coordinates[1], f.coordinates[0]], { icon, title: f.name }).addTo(group);
        marker.on('click', () => {
          setActiveInspector({
            type: 'CIRCULAR ECONOMY ASSET',
            title: f.name,
            badge: (f.acceptedCategories || []).join(' &bull; ').toUpperCase() || 'SCRAP RECOVERY',
            badgeVariant: 'yellow',
            subtitle: f.address,
            metrics: [
              { label: 'Verification', value: (f.verificationStatus || 'VERIFIED').toUpperCase() },
              { label: 'Facility Type', value: (f.facilityType || 'Scrap Center').replace(/_/g, ' ').toUpperCase() },
              { label: 'Categories Handled', value: (f.acceptedCategories || []).join(', ') },
              { label: 'Contact Helpline', value: f.contactPhone || 'Available at entrance' },
            ],
            description: 'Authorized municipal and private scrap recovery facility supporting dry waste diversion.',
            prototypeNotice: 'Registered resource recovery facility record in Kamrup Metropolitan division.',
          });
        });
      });
    }

    // 7. Civic Complaints
    if (layers.complaints) {
      complaints.forEach((c) => {
        const [cLng, cLat] = c.coordinates;

        const icon = L.divIcon({
          className: 'custom-complaint',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group touch-manipulation">
              <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center text-white transition-transform group-hover:scale-125">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([cLat, cLng], { icon, title: c.caption }).addTo(group);
        marker.on('click', () => {
          setActiveInspector({
            type: 'CITIZEN ENVIRONMENTAL REPORT',
            title: c.caption,
            badge: `${(c.status || 'REPORTED').toUpperCase()}`,
            badgeVariant: c.status === 'Resolved' ? 'green' : c.status === 'Under Review' ? 'yellow' : 'red',
            subtitle: c.address,
            imageUrl: c.imageUrl,
            metrics: [
              { label: 'Reported By', value: `${c.userDisplayName} (${c.userRole || 'Citizen'})` },
              { label: 'Category', value: c.category.replace(/_/g, ' ').toUpperCase() },
              { label: 'Constituency', value: c.constituencyName || 'Guwahati Municipal' },
              { label: 'Community Signals', value: `❤️ ${c.likesCount || 0}  💬 ${c.commentsCount || c.comments?.length || 0}` },
              { label: 'Prototype MLA', value: c.prototypeRepresentative || 'Assigned automatically' },
              { label: 'Reported Date', value: new Date(c.createdAt).toLocaleDateString() },
            ],
            description: c.description || 'Public citizen report published to EcoSphere community feed.',
            prototypeNotice: 'Prototype MLA representation mapped via Point-in-Polygon calculation',
            actionLink: { href: `/complaints/${c.id}`, label: 'View full report' },
          });
        });
      });
    }
  }, [layers, wasteBins, recyclingFacilities, waterbodies, aqiStations, trafficObservations, complaints]);

  // Update User Selected Pin
  const renderUserPin = useCallback((L: typeof Leaflet, map: Leaflet.Map, coords?: [number, number]) => {
    if (!L || !map) return;

    if (userMarkerRef.current) {
      try {
        map.removeLayer(userMarkerRef.current);
      } catch (e) {
        // Ignore
      }
      userMarkerRef.current = null;
    }

    if (!coords) return;

    const icon = L.divIcon({
      className: 'custom-user-pin',
      html: `
        <div class="relative flex items-center justify-center animate-bounce touch-manipulation">
          <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-50"></span>
          <div class="w-10 h-10 rounded-full bg-emerald-600 border-3 border-white shadow-2xl flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([coords[1], coords[0]], {
      icon,
      draggable: Boolean(onLocationSelect),
      title: 'Incident location',
    }).addTo(map);

    userMarkerRef.current = marker;

    if (onLocationSelect) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationSelect([Number(pos.lng.toFixed(5)), Number(pos.lat.toFixed(5))]);
      });
    }
  }, [onLocationSelect]);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      leafletLibRef.current = L;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Mobile-friendly map configuration
      const map = L.map(container, {
        center: container.clientWidth < 550 ? [26.1535, GUWAHATI_COORDS[1]] : GUWAHATI_COORDS,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        dragging: true,
      });

      // Layer Group for markers, polylines, and circles
      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      // Custom Clean Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: false,
        })
        .addTo(map);

      // Handle Pin Selection Click
      map.on('click', (event: Leaflet.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng.wrap();
        selectMapLocation([Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
      });

      setMapReady(true);

      map.invalidateSize();
    }).catch(() => {
      if (isMounted) setMapError('The map could not load. Use the directory or enter coordinates manually.');
    });

    // ResizeObserver ensures map container never blanks on viewport/orientation changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Tiles when Mode Changes
  useEffect(() => {
    if (!mapReady || !leafletLibRef.current || !mapInstanceRef.current) return;
    applyTileLayer(leafletLibRef.current, mapInstanceRef.current, basemapMode);
  }, [basemapMode, mapReady, applyTileLayer]);

  // Update Environmental Data Layers when Filters or Data change
  useEffect(() => {
    if (!mapReady || !leafletLibRef.current || !mapInstanceRef.current || !layersGroupRef.current) return;
    renderEnvironmentalLayers(leafletLibRef.current, layersGroupRef.current);
  }, [mapReady, renderEnvironmentalLayers]);

  // Update Selected User Pin when coords change
  useEffect(() => {
    if (!mapReady || !leafletLibRef.current || !mapInstanceRef.current) return;
    renderUserPin(leafletLibRef.current, mapInstanceRef.current, selectedLocation);

    if (selectedLocation) {
      mapInstanceRef.current.flyTo([selectedLocation[1], selectedLocation[0]], 15, { duration: 0.8, animate: !reduceMotion() });
    }
  }, [selectedLocation, mapReady, renderUserPin]);

  // Jump to Hotspot
  const handleJumpTo = (lat: number, lng: number, zoomLevel: number) => {
    mapInstanceRef.current?.flyTo([lat, lng], zoomLevel, { duration: 1.2, animate: !reduceMotion() });
  };

  // GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is unavailable.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          Number(pos.coords.longitude.toFixed(5)),
          Number(pos.coords.latitude.toFixed(5)),
        ];
        if (onLocationSelect) onLocationSelect(coords);
        setMapError('');
        handleJumpTo(pos.coords.latitude, pos.coords.longitude, 15);
      },
      () => {
        setMapError('Could not determine your location.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setActiveInspector(null);
          setIsFullscreen(false);
        }
      }}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[1000] rounded-none w-screen h-screen'
          : `relative w-full ${heightClass} rounded-2xl`
      } isolate overflow-hidden border border-zinc-200/90 shadow-sm bg-[#0a1411] transition-all select-none`}
    >
      {/* 
        High-Tech Satellite Graphic Backdrop:
        Ensures the container NEVER renders as a blank gray box even while tiles stream or if offline.
      */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`${backgroundId}-grid`} width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.2" />
            </pattern>
            <linearGradient id={`${backgroundId}-river`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${backgroundId}-grid)`} />
          {/* Simulated Brahmaputra River S-Curve */}
          <path
            d="M -50 200 Q 250 140 450 230 T 900 180 T 1400 240 T 2000 190"
            fill="none"
            stroke={`url(#${backgroundId}-river)`}
            strokeWidth="38"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Real Map Canvas */}
      <div
        ref={mapContainerRef}
        role="region"
        aria-label="Interactive environmental map"
        className="absolute inset-x-0 top-[5.75rem] bottom-[3.75rem] border-y border-zinc-800"
        style={{ height: 'auto', touchAction: 'pan-x pan-y' }}
      />
      <p role="status" className="absolute bottom-12 left-3 z-[410] max-w-[75%] rounded bg-zinc-950 text-white empty:hidden px-2 py-1 text-xs">
        {mapError || (tileLoadError ? 'Some map tiles are unavailable. Environmental markers and the directory are still available.' : '')}
      </p>

      {/* Top Left: Basemap Mode Switcher (Satellite / Hybrid / Dark / Streets) */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-[400] flex items-center gap-1 p-1 bg-zinc-950/92 backdrop-blur-md rounded-xl border border-zinc-800 shadow-2xl max-w-[calc(100vw-5rem)] sm:max-w-none overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setBasemapMode('satellite')}
          aria-pressed={basemapMode === 'satellite'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
            basemapMode === 'satellite'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
          title="High-Resolution Photorealistic Satellite (Zero API Key)"
        >
          <Satellite className="h-3.5 w-3.5" />
          <span>Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setBasemapMode('hybrid')}
          aria-pressed={basemapMode === 'hybrid'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
            basemapMode === 'hybrid'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
          title="Satellite + Street & Location Labels"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Hybrid</span>
        </button>

        <button
          type="button"
          onClick={() => setBasemapMode('dark')}
          aria-pressed={basemapMode === 'dark'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
            basemapMode === 'dark'
              ? 'bg-zinc-800 text-white font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
          title="Dark Cartography"
        >
          <Moon className="h-3.5 w-3.5" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setBasemapMode('streets')}
          aria-pressed={basemapMode === 'streets'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
            basemapMode === 'streets'
              ? 'bg-zinc-800 text-white font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
          }`}
          title="Light Cartography"
        >
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={(event) => { event.currentTarget.focus(); explanation.current?.showModal(); }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 ml-0.5 shrink-0"
          title="How this zero-API-key map works"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Floating HUD: Environmental Layer Filter Chips (Desktop & Tablet) */}
      <div className="absolute top-14 sm:top-3 left-2.5 sm:left-auto sm:right-16 z-[400] hidden sm:flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-950/92 backdrop-blur-md rounded-xl border border-zinc-800 shadow-2xl">
        {/* Bio Bins */}
        <button
          type="button"
          onClick={() => setLayers({ ...layers, bioBins: !layers.bioBins })}
          aria-pressed={layers.bioBins}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            layers.bioBins ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-300" />
          <span>Bio Bins</span>
        </button>

        {/* Non-Bio Bins */}
        <button
          type="button"
          onClick={() => setLayers({ ...layers, nonBioBins: !layers.nonBioBins })}
          aria-pressed={layers.nonBioBins}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            layers.nonBioBins ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-300" />
          <span>Non-Bio Bins</span>
        </button>

        {/* River Pollution */}
        <button
          type="button"
          onClick={() => setLayers({ ...layers, waterbodies: !layers.waterbodies })}
          aria-pressed={layers.waterbodies}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            layers.waterbodies ? 'bg-rose-600 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Droplet className="h-3 w-3" />
          <span>River Hypoxia</span>
        </button>

        {/* AQI Atmospheric Rings */}
        <button
          type="button"
          onClick={() => setLayers({ ...layers, aqi: !layers.aqi })}
          aria-pressed={layers.aqi}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            layers.aqi ? 'bg-amber-600 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Wind className="h-3 w-3 text-amber-300" />
          <span>NAQI Stations</span>
        </button>

        {/* Traffic Pollution Signal */}
        <button
          type="button"
          onClick={() => setLayers({ ...layers, traffic: !layers.traffic })}
          aria-pressed={layers.traffic}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            layers.traffic ? 'bg-red-600 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Car className="h-3 w-3" />
          <span>Traffic Emissions</span>
        </button>

        {/* Civic Complaints */}
        <button
          type="button"
          onClick={() => setLayers({ ...layers, complaints: !layers.complaints })}
          aria-pressed={layers.complaints}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            layers.complaints ? 'bg-zinc-700 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>Complaints</span>
        </button>
      </div>

      {/* Mobile Horizontal Scrolling Layer Bar */}
      <div className="absolute top-14 left-2.5 right-2.5 z-[400] flex sm:hidden items-center gap-1.5 p-1 bg-zinc-950/92 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xl overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setLayers({ ...layers, bioBins: !layers.bioBins })}
          aria-pressed={layers.bioBins}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 ${
            layers.bioBins ? 'bg-emerald-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
          <span>Bio</span>
        </button>
        <button
          type="button"
          onClick={() => setLayers({ ...layers, nonBioBins: !layers.nonBioBins })}
          aria-pressed={layers.nonBioBins}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 ${
            layers.nonBioBins ? 'bg-sky-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
          <span>Dry</span>
        </button>
        <button
          type="button"
          onClick={() => setLayers({ ...layers, waterbodies: !layers.waterbodies })}
          aria-pressed={layers.waterbodies}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 ${
            layers.waterbodies ? 'bg-rose-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <Droplet className="h-2.5 w-2.5" />
          <span>River</span>
        </button>
        <button
          type="button"
          onClick={() => setLayers({ ...layers, aqi: !layers.aqi })}
          aria-pressed={layers.aqi}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 ${
            layers.aqi ? 'bg-amber-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <Wind className="h-2.5 w-2.5" />
          <span>NAQI</span>
        </button>
        <button
          type="button"
          onClick={() => setLayers({ ...layers, traffic: !layers.traffic })}
          aria-pressed={layers.traffic}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 ${
            layers.traffic ? 'bg-red-600 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <Car className="h-2.5 w-2.5" />
          <span>Traffic</span>
        </button>
        <button
          type="button"
          onClick={() => setLayers({ ...layers, complaints: !layers.complaints })}
          aria-pressed={layers.complaints}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 ${
            layers.complaints ? 'bg-zinc-700 text-white' : 'text-zinc-400 bg-zinc-900'
          }`}
        >
          <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
          <span>Reports</span>
        </button>
      </div>

      {/* Hotspots Quick Jump Ribbon (Desktop) */}
      <div className="absolute top-14 left-3 z-[400] hidden md:flex items-center gap-1 p-1 bg-zinc-950/92 backdrop-blur-md rounded-lg border border-zinc-800 shadow-md text-[10px]">
        <span className="font-mono text-zinc-500 uppercase px-1.5 font-semibold">Hotspots:</span>
        {HOTSPOTS.map((h) => (
          <button
            key={h.name}
            type="button"
            onClick={() => handleJumpTo(h.lat, h.lng, h.zoom)}
            className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 font-medium transition-colors"
          >
            {h.name.split(' (')[0]}
          </button>
        ))}
      </div>

      {/* Floating Action Controls (Right) */}
      {interactive && (
        <div className="absolute bottom-2 right-2.5 sm:right-3 z-[400] flex gap-1.5">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-pressed={isFullscreen}
            className="p-3 rounded-xl bg-zinc-950/92 backdrop-blur-md border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 shadow-xl transition-all active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Prototype Map'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-emerald-400" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            className="p-3 rounded-xl bg-zinc-950/92 backdrop-blur-md border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 shadow-xl transition-all active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="My GPS Location"
            aria-label="Find My GPS Location"
          >
            <Locate className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-3 rounded-xl bg-zinc-950/92 backdrop-blur-md border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 shadow-xl transition-all active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-3 rounded-xl bg-zinc-950/92 backdrop-blur-md border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 shadow-xl transition-all active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bottom Environmental Legend (Desktop) */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center gap-3 bg-zinc-950/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-zinc-800 shadow-xl text-[11px] text-zinc-300 font-medium">
        <span className="flex items-center gap-1.5 text-white font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bio Bins
        </span>
        <span className="flex items-center gap-1.5 text-white font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Non-Bio Bins
        </span>
        <span className="flex items-center gap-1.5 text-white font-semibold">
          <span className="w-3 h-1.5 bg-rose-600 rounded-xs" /> Bharalu Hypoxic Canal
        </span>
        <span className="flex items-center gap-1.5 text-white font-semibold">
          <span className="w-3 h-1.5 bg-rose-500 rounded-xs" /> Heavy Traffic Exhaust
        </span>
        <span className="flex items-center gap-1.5 text-white font-semibold">
          <span className="w-2.5 h-2.5 rounded-full border border-amber-400 border-dashed" /> NAQI Dispersion
        </span>
      </div>

      {/* Interactive Detail Inspector Drawer */}
      {activeInspector && (
        <div className="fixed inset-x-2.5 bottom-2.5 sm:inset-x-auto sm:absolute sm:bottom-4 sm:left-3 sm:right-auto sm:w-96 z-[600] rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 p-4 sm:p-5 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[65vh] overflow-y-auto">
          <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-semibold block">
                {activeInspector.type}
              </span>
              <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
                {activeInspector.title}
              </h3>
              {activeInspector.subtitle && (
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {activeInspector.subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveInspector(null)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close Inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  activeInspector.badgeVariant === 'green'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : activeInspector.badgeVariant === 'blue'
                    ? 'bg-sky-950 text-sky-300 border-sky-800'
                    : activeInspector.badgeVariant === 'red'
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}
              >
                {activeInspector.badge}
              </span>
            </div>

            {activeInspector.imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-zinc-900 mt-2">
                <img
                  src={activeInspector.imageUrl}
                  alt={activeInspector.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {activeInspector.description && (
              <p className="text-zinc-300 text-xs leading-relaxed">
                {activeInspector.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              {activeInspector.metrics.map((m) => (
                <div
                  key={m.label}
                  className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80"
                >
                  <div className="font-mono text-[9px] uppercase text-zinc-500">
                    {m.label}
                  </div>
                  <div className="font-semibold text-zinc-100 text-[11px] mt-0.5 line-clamp-1">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {activeInspector.actionLink && (
              <div className="pt-2">
                <a
                  href={activeInspector.actionLink.href}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-all"
                >
                  <span>{activeInspector.actionLink.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </a>
              </div>
            )}

            {activeInspector.prototypeNotice && (
              <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center gap-1.5">
                <Info className="h-3 w-3 shrink-0 text-zinc-400" />
                <span>{activeInspector.prototypeNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* "How This Prototype Map Works" Explanation Modal */}
        <dialog
          ref={explanation}
          aria-labelledby={explanationTitle}
          onKeyDown={(event) => event.stopPropagation()}
          className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-transparent backdrop:bg-black/80"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-emerald-400" />
                <h3 id={explanationTitle} className="font-semibold text-sm">About this environmental map</h3>
              </div>
              <button
                type="button"
                onClick={() => explanation.current?.close()}
                className="p-2 text-zinc-300 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
              <p>
                This map renders <strong>real photorealistic high-resolution satellite imagery</strong> of Guwahati directly from global open geospatial servers (Esri World Imagery) combined with custom civic intelligence telemetry.
              </p>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="font-mono text-[11px] text-emerald-400 font-semibold">
                  1. Zero API Key Dependency:
                </div>
                <p className="text-[11px] text-zinc-400">
                  Basemaps use remote tiles and require an internet connection. The environmental directory is available when tiles fail to load.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="font-mono text-[11px] text-sky-400 font-semibold">
                  2. Satellite Surface Verification:
                </div>
                <p className="text-[11px] text-zinc-400">
                  You can clearly inspect the actual physical terrain of Guwahati: the wide flowing Brahmaputra river, Peacock Island, Kamakhya Hill, and the urban canyon along GS Road.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="font-mono text-[11px] text-rose-400 font-semibold">
                  3. Multi-Layer Environmental Overlays:
                </div>
                <p className="text-[11px] text-zinc-400">
                  Overlaid directly on top of the satellite view are GMC segregated dustbins (green/blue), Bharalu Canal hypoxia telemetry, atmospheric NAQI dispersion plumes, and vehicular congestion exhaust corridors.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => explanation.current?.close()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow-sm"
              >
                Close & Return to Map
              </button>
            </div>
          </div>
        </dialog>
    </div>
  );
};
