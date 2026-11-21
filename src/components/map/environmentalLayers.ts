import type {
  WasteBin,
  RecyclingFacility,
  Waterbody,
  AQIMeasurement,
  TrafficObservation,
  Complaint,
} from '@/lib/types';
import type * as Leaflet from 'leaflet';
import type { LayerId } from './LayerControls';

export interface EnvironmentalMapData {
  wasteBins: WasteBin[];
  recyclingFacilities: RecyclingFacility[];
  waterbodies: Waterbody[];
  aqiStations: AQIMeasurement[];
  trafficObservations: TrafficObservation[];
  complaints: Complaint[];
}

export interface MapInspector {
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
}

interface LayerContext {
  L: typeof Leaflet;
  group: Leaflet.LayerGroup;
  inspect: (item: MapInspector) => void;
}

const binStyles = {
  biodegradable: {
    className: 'custom-bin-bio', shortLabel: 'BIO', markerTitle: 'Biodegradable bin',
    halo: 'bg-emerald-400', fill: 'bg-emerald-600', tag: 'bg-emerald-700',
    title: 'Biodegradable Organic Dustbin', badge: 'GREEN BIN (WET WASTE)', variant: 'green',
    agencyLabel: 'Sanitation Division',
    description: 'Exclusively intended for compostable kitchen waste, fruit/vegetable discards, and biological matter.',
  },
  non_biodegradable: {
    className: 'custom-bin-dry', shortLabel: 'DRY', markerTitle: 'Non-biodegradable bin',
    halo: 'bg-sky-400', fill: 'bg-sky-600', tag: 'bg-sky-700',
    title: 'Non-Biodegradable Recyclables Dustbin', badge: 'BLUE BIN (DRY WASTE)', variant: 'blue',
    agencyLabel: 'Inspection Agency',
    description: 'Designed for dry recyclables: PET bottles, clean plastics, aluminum cans, glass, and paper.',
  },
} as const;

// GeoJSON stores longitude first. Leaflet expects latitude first.
function toLatLng([longitude, latitude]: [number, number]): Leaflet.LatLngTuple {
  return [latitude, longitude];
}

function addWasteBins({ L, group, inspect }: LayerContext, bins: WasteBin[], visible: Record<LayerId, boolean>) {
  for (const bin of bins) {
    const layer = bin.category === 'biodegradable' ? 'bioBins' : 'nonBioBins';
    if (!visible[layer]) continue;
    const style = binStyles[bin.category];
    const icon = L.divIcon({
      className: style.className,
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group touch-manipulation">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full ${style.halo} opacity-40"></span>
          <div class="w-8 h-8 rounded-full ${style.fill} border-2 border-white shadow-xl flex items-center justify-center text-white transition-transform group-hover:scale-125">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </div>
          <span class="absolute -bottom-2 ${style.tag} text-white font-mono text-[8px] font-bold px-1 rounded shadow-xs">${style.shortLabel}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker(toLatLng(bin.coordinates), { icon, title: `${style.markerTitle}: ${bin.address}` }).addTo(group);
    marker.on('click', () => {
      inspect({
        type: 'MUNICIPAL INFRASTRUCTURE',
        title: style.title,
        badge: style.badge,
        badgeVariant: style.variant,
        subtitle: bin.address,
        metrics: [
          { label: 'Volume Capacity', value: `${bin.capacityLiters} L` },
          { label: 'Fill Status', value: bin.fillStatus.toUpperCase() },
          { label: 'Coordinates', value: `${bin.coordinates[1].toFixed(4)}, ${bin.coordinates[0].toFixed(4)}` },
          { label: style.agencyLabel, value: bin.verifiedBy },
        ],
        description: style.description,
        prototypeNotice: 'Guwahati Municipal Corporation Ward Demonstration Record',
      });
    });
  }
}

function addWaterbodies({ L, group, inspect }: LayerContext, waterbodies: Waterbody[]) {
  waterbodies.forEach((waterbody) => {
    if (waterbody.polylineCoordinates && waterbody.polylineCoordinates.length > 1) {
      const latLngs = waterbody.polylineCoordinates.map(toLatLng);

      const color =
        waterbody.pollutionLevel === 'critical'
          ? '#DC2626'
          : waterbody.pollutionLevel === 'severe'
          ? '#EA580C'
          : '#0284C7';

      const polyline = L.polyline(latLngs, {
        color,
        weight: 6,
        opacity: 0.9,
        dashArray: waterbody.pollutionLevel === 'critical' ? '8, 8' : undefined,
      }).addTo(group);

      polyline.on('click', () => {
        inspect({
          type: 'HYDROLOGICAL CORRIDOR',
          title: waterbody.name,
          badge: `${waterbody.pollutionLevel.toUpperCase()} POLLUTION (DO: ${waterbody.dissolvedOxygenMgL ?? 0.8} mg/L)`,
          badgeVariant: waterbody.pollutionLevel === 'critical' ? 'red' : 'yellow',
          subtitle: `${waterbody.waterbodyType.toUpperCase()} &bull; Guwahati Drainage Basin`,
          metrics: [
            { label: 'Dissolved Oxygen (DO)', value: `${waterbody.dissolvedOxygenMgL ?? 'N/A'} mg/L` },
            { label: 'Biochem. Oxygen Demand (BOD)', value: `${waterbody.bodMgL ?? 'N/A'} mg/L` },
            { label: 'Primary Stressors', value: waterbody.primaryPollutants?.join(', ') || 'Untreated solid waste' },
            { label: 'Data Source', value: waterbody.dataSource || 'SPCB Assam' },
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
          <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full ${waterbody.pollutionLevel === 'critical' ? 'bg-rose-500' : 'bg-sky-400'} opacity-60"></span>
          <div class="w-8 h-8 rounded-full ${waterbody.pollutionLevel === 'critical' ? 'bg-rose-600' : 'bg-sky-600'} border-2 border-white shadow-xl flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker(toLatLng(waterbody.coordinates), { icon, title: waterbody.name }).addTo(group);
    marker.on('click', () => {
      inspect({
        type: 'HYDROLOGICAL CORRIDOR',
        title: waterbody.name,
        badge: `${waterbody.pollutionLevel.toUpperCase()} POLLUTION (DO: ${waterbody.dissolvedOxygenMgL ?? 0.8} mg/L)`,
        badgeVariant: waterbody.pollutionLevel === 'critical' ? 'red' : 'yellow',
        subtitle: `${waterbody.waterbodyType.toUpperCase()} &bull; Guwahati Drainage Basin`,
        metrics: [
          { label: 'Dissolved Oxygen (DO)', value: `${waterbody.dissolvedOxygenMgL ?? 'N/A'} mg/L` },
          { label: 'Biochem. Oxygen Demand (BOD)', value: `${waterbody.bodMgL ?? 'N/A'} mg/L` },
          { label: 'Primary Stressors', value: waterbody.primaryPollutants?.join(', ') || 'Solid waste' },
          { label: 'Testing Agency', value: waterbody.dataSource || 'SPCB Assam' },
        ],
        description: `Key waterbody in Kamrup Metropolitan. Dissolved oxygen levels indicate anaerobic conditions near uncollected waste discharge points.`,
        prototypeNotice: 'Thresholds modeled after regional Assam water monitoring stations.',
      });
    });
  });
}

function addTrafficCorridors({ L, group, inspect }: LayerContext, trafficObservations: TrafficObservation[]) {
  trafficObservations.forEach((traffic) => {
    const coords = traffic.coordinates;
    if (coords && coords.length > 1) {
      const latLngs = coords.map(toLatLng);

      const color =
        traffic.congestionLevel === 'heavy' || traffic.congestionLevel === 'severe'
          ? '#EF4444'
          : traffic.congestionLevel === 'moderate'
          ? '#F59E0B'
          : '#10B981';

      const trafficLine = L.polyline(latLngs, {
        color,
        weight: 7,
        opacity: 0.85,
      }).addTo(group);

      trafficLine.on('click', () => {
        inspect({
          type: 'VEHICULAR EMISSION CORRIDOR',
          title: traffic.roadName,
          badge: `${traffic.congestionLevel.toUpperCase()} CONGESTION`,
          badgeVariant: traffic.congestionLevel === 'heavy' || traffic.congestionLevel === 'severe' ? 'red' : 'yellow',
          subtitle: 'Tailpipe Emission Surge Analysis',
          metrics: [
            { label: 'Average Speed', value: `${traffic.averageSpeedKmh} km/h` },
            { label: 'Pollution Index', value: traffic.airPollutionIndex || 'High' },
            { label: 'Emission Impact', value: traffic.emissionImpact || 'Elevated localized PM2.5' },
            { label: 'Updated At', value: new Date(traffic.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ],
          description: `High vehicle idling along ${traffic.roadName || 'corridor'} correlates directly with localized air pollution spikes and nitrogen dioxide elevation.`,
          prototypeNotice: 'Synthetic traffic telemetry calibrated to regional vehicular bottlenecks.',
        });
      });
    }
  });
}

function addAirStations({ L, group, inspect }: LayerContext, aqiStations: AQIMeasurement[]) {
  aqiStations.forEach((station) => {
    const color =
      station.category === 'Poor'
        ? '#DC2626'
        : station.category === 'Moderate'
        ? '#D97706'
        : '#10B981';

    // Atmospheric Dispersion Radius Ring
    L.circle(toLatLng(station.coordinates), {
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
            <span>${station.aqiValue}</span>
            <span class="text-[7px] uppercase font-sans opacity-85">NAQI</span>
          </div>
        </div>
      `,
      iconSize: [48, 28],
      iconAnchor: [24, 14],
    });

    const marker = L.marker(toLatLng(station.coordinates), { icon, title: station.stationName }).addTo(group);
    marker.on('click', () => {
      inspect({
        type: 'ATMOSPHERIC OBSERVATORY',
        title: station.stationName,
        badge: `${station.category.toUpperCase()} AIR QUALITY`,
        badgeVariant: station.category === 'Poor' ? 'red' : station.category === 'Moderate' ? 'yellow' : 'green',
        subtitle: station.aqiScale,
        metrics: [
          { label: 'National AQI Score', value: `${station.aqiValue}` },
          { label: 'Fine PM2.5', value: `${station.pm25} µg/m³` },
          { label: 'Coarse PM10', value: `${station.pm10} µg/m³` },
          { label: 'Dominant Pollutant', value: station.dominantPollutant },
        ],
        description: `Health guidance: ${
          station.aqiValue > 200
            ? 'Unhealthy for sensitive individuals and active citizens. High localized dust and vehicular tailpipe particulates.'
            : 'Moderate air condition. Outdoor exposure acceptable for general public.'
        }`,
        prototypeNotice: station.sourceLabel,
      });
    });
  });
}

function addRecyclingFacilities({ L, group, inspect }: LayerContext, recyclingFacilities: RecyclingFacility[]) {
  recyclingFacilities.forEach((facility) => {
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

    const marker = L.marker(toLatLng(facility.coordinates), { icon, title: facility.name }).addTo(group);
    marker.on('click', () => {
      inspect({
        type: 'CIRCULAR ECONOMY ASSET',
        title: facility.name,
        badge: (facility.acceptedCategories || []).join(' &bull; ').toUpperCase() || 'SCRAP RECOVERY',
        badgeVariant: 'yellow',
        subtitle: facility.address,
        metrics: [
          { label: 'Verification', value: (facility.verificationStatus || 'VERIFIED').toUpperCase() },
          { label: 'Facility Type', value: (facility.facilityType || 'Scrap Center').replace(/_/g, ' ').toUpperCase() },
          { label: 'Categories Handled', value: (facility.acceptedCategories || []).join(', ') },
          { label: 'Contact Helpline', value: facility.contactPhone || 'Available at entrance' },
        ],
        description: 'Authorized municipal and private scrap recovery facility supporting dry waste diversion.',
        prototypeNotice: 'Registered resource recovery facility record in Kamrup Metropolitan division.',
      });
    });
  });
}

function addCivicReports({ L, group, inspect }: LayerContext, complaints: Complaint[]) {
  complaints.forEach((complaint) => {
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

    const marker = L.marker(toLatLng(complaint.coordinates), { icon, title: complaint.caption }).addTo(group);
    marker.on('click', () => {
      inspect({
        type: 'CITIZEN ENVIRONMENTAL REPORT',
        title: complaint.caption,
        badge: `${(complaint.status || 'REPORTED').toUpperCase()}`,
        badgeVariant: complaint.status === 'Resolved' ? 'green' : complaint.status === 'Under Review' ? 'yellow' : 'red',
        subtitle: complaint.address,
        imageUrl: complaint.imageUrl,
        metrics: [
          { label: 'Reported By', value: `${complaint.userDisplayName} (${complaint.userRole || 'Citizen'})` },
          { label: 'Category', value: complaint.category.replace(/_/g, ' ').toUpperCase() },
          { label: 'Constituency', value: complaint.constituencyName || 'Guwahati Municipal' },
          { label: 'Community Signals', value: `❤️ ${complaint.likesCount || 0}  💬 ${complaint.commentsCount || complaint.comments?.length || 0}` },
          { label: 'Prototype MLA', value: complaint.prototypeRepresentative || 'Assigned automatically' },
          { label: 'Reported Date', value: new Date(complaint.createdAt).toLocaleDateString() },
        ],
        description: complaint.description || 'Public citizen report published to EcoSphere community feed.',
        prototypeNotice: 'Prototype MLA representation mapped via Point-in-Polygon calculation',
        actionLink: { href: `/complaints/${complaint.id}`, label: 'View full report' },
      });
    });
  });
}

export function renderEnvironmentalLayers(
  context: LayerContext,
  data: EnvironmentalMapData,
  visible: Record<LayerId, boolean>,
) {
  context.group.clearLayers();
  addWasteBins(context, data.wasteBins, visible);
  if (visible.waterbodies) addWaterbodies(context, data.waterbodies);
  if (visible.traffic) addTrafficCorridors(context, data.trafficObservations);
  if (visible.aqi) addAirStations(context, data.aqiStations);
  addRecyclingFacilities(context, data.recyclingFacilities);
  if (visible.complaints) addCivicReports(context, data.complaints);
}
