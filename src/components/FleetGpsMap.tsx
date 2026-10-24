import { exportCsv } from '../utils/download.ts';
import React, { useEffect, useState, useMemo } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Asset, AssetStatus } from '../types/index.ts';
import {
  MapPin,
  Navigation,
  Compass,
  Zap,
  Radio,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  Calendar,
  Layers,
  Info,
  Clock,
  Gauge,
  UserCheck,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';

interface FleetGpsMapProps {
  assets: Asset[];
  onSelectAsset?: (asset: Asset) => void;
  onOpenLegalDocs?: (asset: Asset) => void;
}

interface SiteLocation {
  id: string;
  name: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  description: string;
}

const DEFAULT_SITES: Record<string, SiteLocation> = {
  morowali: {
    id: 'morowali',
    name: 'Morowali Nickel & Smelter Project Site',
    city: 'Morowali',
    province: 'Central Sulawesi',
    latitude: -2.545,
    longitude: 121.353,
    description: 'Integrated Block B smelter and nickel mining industrial area',
  },
  balikpapan: {
    id: 'balikpapan',
    name: 'Balikpapan Main Depot & Workshop',
    city: 'Balikpapan',
    province: 'East Kalimantan',
    latitude: -1.265,
    longitude: 116.831,
    description: 'Logistics depot, heavy equipment workshop, and Kalimantan fleet yard',
  },
  ikn: {
    id: 'ikn',
    name: 'IKN Nusantara Pier 2 Project Site',
    city: 'Sepaku, Penajam',
    province: 'East Kalimantan',
    latitude: -0.965,
    longitude: 116.711,
    description: 'IKN infrastructure project for the pier and Pulau Balang bridge',
  },
  wedabay: {
    id: 'wedabay',
    name: 'Site Weda Bay Halmahera',
    city: 'Halmahera Tengah',
    province: 'North Maluku',
    latitude: 0.472,
    longitude: 127.954,
    description: 'Ore mining operations and special-port logistics',
  },
  jakarta: {
    id: 'jakarta',
    name: 'Jakarta & Cikarang Headquarters and Fleet Yard',
    city: 'Jakarta / Cikarang',
    province: 'Jakarta & West Java',
    latitude: -6.208,
    longitude: 106.845,
    description: 'Headquarters hub, asset inspection, and Java distribution staging',
  },
  surabaya: {
    id: 'surabaya',
    name: 'Surabaya–Gresik Branch & Workshop Depot',
    city: 'Surabaya & Gresik',
    province: 'East Java',
    latitude: -7.257,
    longitude: 112.752,
    description: 'Equipment refurbishment workshop, parts warehouse, and crane yard',
  },
  timika: {
    id: 'timika',
    name: 'Site Project Timika Grasberg Corridor',
    city: 'Timika',
    province: 'Central Papua',
    latitude: -4.546,
    longitude: 136.883,
    description: 'Specialized highland mining fleet and Amamapare port site',
  },
};

const isValidGpsLocation = (
  asset: Asset
): asset is Asset & { gpsLocation: NonNullable<Asset['gpsLocation']> } => {
  const location = asset.gpsLocation;
  return !!location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180;
};

const MapViewportController: React.FC<{
  assets: Asset[];
  siteFilter: string;
}> = ({ assets, siteFilter }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const coordinateAssets = useMemo(() => assets.filter(isValidGpsLocation), [assets]);
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  useEffect(() => {
    const beforePrint = () => { map.invalidateSize({ animate: false }); map.eachLayer((layer: any) => { if (typeof layer.redraw === 'function') layer.redraw(); }); window.setTimeout(() => map.invalidateSize({ animate: false }), 250); window.setTimeout(() => map.invalidateSize({ animate: false }), 800); };
    const afterPrint = () => map.invalidateSize({ animate: false });
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => { window.removeEventListener('beforeprint', beforePrint); window.removeEventListener('afterprint', afterPrint); };
  }, [map]);

  useEffect(() => {
    if (coordinateAssets.length === 0) {
      const site = DEFAULT_SITES[siteFilter];
      map.setView(site ? [site.latitude, site.longitude] : [-2.5, 118], site ? 9 : 5);
      return;
    }

    const bounds: LatLngBoundsExpression = coordinateAssets.map((asset) => [
      asset.gpsLocation.latitude,
      asset.gpsLocation.longitude,
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [coordinateAssets, map, siteFilter]);

  return (
    <div className="absolute top-4 right-4 z-[20] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-white shadow-lg">
      <button type="button" onClick={() => map.zoomIn()} className="px-2 py-1 hover:bg-slate-800 rounded font-bold text-xs" title="Zoom in">+</button>
      <span className="text-[10px] font-mono px-1 text-slate-300">{zoom}x</span>
      <button type="button" onClick={() => map.zoomOut()} className="px-2 py-1 hover:bg-slate-800 rounded font-bold text-xs" title="Zoom out">-</button>
      <button
        type="button"
        onClick={() => {
          if (coordinateAssets.length > 0) {
            map.fitBounds(
              coordinateAssets.map((asset) => [
                asset.gpsLocation.latitude,
                asset.gpsLocation.longitude,
              ]),
              { padding: [40, 40], maxZoom: 9 }
            );
          } else {
            map.setView([-2.5, 118], 5);
          }
        }}
        className="px-2 py-1 hover:bg-slate-800 rounded text-[10px] font-medium text-amber-300"
        title="Show all GPS locations"
      >
        Fleet
      </button>
    </div>
  );
};

export const FleetGpsMap: React.FC<FleetGpsMapProps> = ({
  assets,
  onSelectAsset,
  onOpenLegalDocs,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('AST-10024');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTopoView, setShowTopoView] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('printing-fleet-map', printMode);
    return () => document.body.classList.remove('printing-fleet-map');
  }, [printMode]);

  useEffect(() => {
    const finishPrint = () => setPrintMode(false);
    window.addEventListener('afterprint', finishPrint);
    return () => window.removeEventListener('afterprint', finishPrint);
  }, []);

  // Map projection resolver for assets
  const mappedAssets = useMemo(() => {
    return assets.map((asset) => {
      const loc = asset.gpsLocation;
      let siteKey = 'morowali';
      const locText = `${asset.warehouseLocation} ${loc?.siteName || ''} ${loc?.cityName || ''}`.toLowerCase();

      if (locText.includes('ikn') || locText.includes('nusantara')) siteKey = 'ikn';
      else if (locText.includes('balikpapan') || locText.includes('kalimantan')) siteKey = 'balikpapan';
      else if (locText.includes('weda') || locText.includes('halmahera')) siteKey = 'wedabay';
      else if (locText.includes('jakarta') || locText.includes('cikarang')) siteKey = 'jakarta';
      else if (locText.includes('surabaya') || locText.includes('gresik')) siteKey = 'surabaya';
      else if (locText.includes('timika') || locText.includes('papua') || locText.includes('freeport')) siteKey = 'timika';

      const site = DEFAULT_SITES[siteKey] || DEFAULT_SITES.morowali;

      return {
        ...asset,
        siteKey,
        siteInfo: site,
      };
    });
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return mappedAssets.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        a.name.toLowerCase().includes(q) ||
        a.assetTag.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        (a.legalDocs?.plateNumber && a.legalDocs.plateNumber.toLowerCase().includes(q)) ||
        (a.siteInfo?.name && a.siteInfo.name.toLowerCase().includes(q));

      const matchesSite = siteFilter === 'ALL' || a.siteKey === siteFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesSite && matchesStatus;
    });
  }, [mappedAssets, searchTerm, siteFilter, statusFilter]);

  const activeAsset = useMemo(() => {
    return mappedAssets.find((a) => a.id === selectedAssetId || a.assetTag === selectedAssetId) || mappedAssets[0];
  }, [mappedAssets, selectedAssetId]);

  // Status Badge Helper
  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Available', color: 'bg-emerald-500 text-white', border: 'border-emerald-600', ring: 'ring-emerald-400' };
      case 'RENTED':
        return { label: 'Rented', color: 'bg-blue-600 text-white', border: 'border-blue-700', ring: 'ring-blue-400' };
      case 'IN_MAINTENANCE':
        return { label: 'In Maintenance', color: 'bg-rose-600 text-white', border: 'border-rose-700', ring: 'ring-rose-400' };
      case 'RESERVED':
        return { label: 'Reserved', color: 'bg-amber-500 text-white', border: 'border-amber-600', ring: 'ring-amber-400' };
      default:
        return { label: status, color: 'bg-slate-600 text-white', border: 'border-slate-700', ring: 'ring-slate-400' };
    }
  };

  // Export to Excel / CSV
  const handleExportLocations = () => {
    const headers = [
      'Asset Tag',
      'Equipment Name',
      'Category',
      'Operating Status',
      'Project Site / Location',
      'City & Province',
      'Latitude',
      'Longitude',
      'Hour Meter (HM)',
      'Engine Ignition',
      'Speed (km/h)',
      'License Plate',
      'Last GPS Ping',
    ];

    const rows = filteredAssets.map((a) => [
      a.assetTag,
      `${a.name}`,
      `${a.category}`,
      a.status,
      `${a.siteInfo?.name || a.warehouseLocation}`,
      `${a.gpsLocation?.cityName || ''}, ${a.gpsLocation?.provinceName || ''}`,
      isValidGpsLocation(a) ? a.gpsLocation.latitude.toFixed(6) : '',
      isValidGpsLocation(a) ? a.gpsLocation.longitude.toFixed(6) : '',
      a.legalDocs?.hourMeter || 0,
      a.gpsLocation?.ignitionOn ? 'ON' : 'OFF',
      a.gpsLocation?.speedKmh || 0,
      a.legalDocs?.plateNumber || '-',
      isValidGpsLocation(a) ? a.gpsLocation?.lastGpsPing || '' : '',
    ]);

    exportCsv(`EARMS_Fleet_GPS_Locations_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div data-print-area className={`fleet-gps-map bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-0 ${printMode ? 'fleet-print-mode' : ''}`}>
      {/* Top Map Header & Telematics Toolbar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Navigation className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Live Heavy Equipment GPS Fleet Map
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              OpenStreetMap
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            OpenStreetMap base layer. Markers appear only for units with valid GPS coordinates.
          </p>
        </div>

        {/* Action Controls */}
        <div className="no-print flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportLocations}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-xs transition-colors"
            title="Export all fleet locations to Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPrintMode(true);
              const deadline = Date.now() + 20000;
              const prepareAndPrint = () => {
                const mapRoot = document.querySelector('.fleet-gps-map.fleet-print-mode');
                const mapElement = mapRoot?.querySelector('.leaflet-container') as HTMLElement | null;
                if (mapElement) { mapElement.style.height = '150mm'; window.dispatchEvent(new Event('resize')); }
                const tiles = Array.from(mapRoot?.querySelectorAll('img.leaflet-tile') || []) as HTMLImageElement[];
                const pending = tiles.some((tile) => !tile.complete || tile.naturalWidth === 0);
                if ((pending || tiles.length === 0) && Date.now() < deadline) { window.setTimeout(prepareAndPrint, 350); return; }
                if (pending || tiles.length === 0) window.alert('Sebagian tile peta belum berhasil dimuat. Pastikan koneksi internet/OpenStreetMap tersedia, lalu coba Print Map kembali.');
                window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
              };
              window.setTimeout(() => window.requestAnimationFrame(prepareAndPrint), 900);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-xs transition-colors"
            title="Print the fleet location map or save it as a PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print Map (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTopoView(!showTopoView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-colors ${
              showTopoView
                ? 'bg-amber-400 text-slate-900 border-amber-300'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showTopoView ? 'OSM Topographic View' : 'OSM Street View'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Site Selector Bar */}
      <div className="no-print p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
        <div className="sm:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search equipment (tag, name, plate, brand)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none focus:border-slate-800"
          />
        </div>

        <div className="sm:col-span-4 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded font-medium text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL">All project sites / depots ({mappedAssets.length} units)</option>
            {Object.entries(DEFAULT_SITES).map(([k, s]) => {
              const count = mappedAssets.filter((a) => a.siteKey === k).length;
              return (
                <option key={k} value={k}>
                  {s.name} ({count} units)
                </option>
              );
            })}
          </select>
        </div>

        <div className="sm:col-span-4 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded font-medium text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL">All fleet statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="IN_MAINTENANCE">In maintenance</option>
            <option value="RESERVED">Reserved</option>
          </select>
        </div>
      </div>

      {/* Main Map View Area & Sidebar Telematics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-slate-950 relative">
        <div className="lg:col-span-8 relative min-h-[460px] overflow-hidden">
          <div className="absolute top-4 left-4 z-[20] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-white text-[11px] shadow-lg">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Fleet GPS Positions</span>
            <span className="text-slate-400">· WGS84</span>
          </div>
          <MapContainer
            center={[-2.5, 118]}
            zoom={5}
            minZoom={3}
            maxZoom={19}
            scrollWheelZoom
            className="h-[460px] w-full bg-slate-950 relative z-0"
          >
            <TileLayer
              key={showTopoView ? 'topo' : 'streets'}
              attribution={showTopoView
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}
              url={showTopoView
                ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              maxZoom={showTopoView ? 17 : 19}
            />
            <MapViewportController assets={filteredAssets} siteFilter={siteFilter} />
            {Object.entries(DEFAULT_SITES)
              .filter(([key]) => siteFilter === 'ALL' || siteFilter === key)
              .map(([key, site]) => (
                <CircleMarker
                  key={site.id}
                  center={[site.latitude, site.longitude]}
                  radius={siteFilter === key ? 8 : 5}
                  pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.8, weight: 2 }}
                  eventHandlers={{ click: () => setSiteFilter(key) }}
                >
                  <Tooltip direction="top" offset={[0, -5]}>{site.city} · Site</Tooltip>
                </CircleMarker>
              ))}
            {filteredAssets.map((asset) => {
              if (!isValidGpsLocation(asset)) return null;
              const gps = asset.gpsLocation;
              const color = asset.status === 'AVAILABLE'
                ? '#10b981'
                : asset.status === 'RENTED'
                  ? '#2563eb'
                  : asset.status === 'IN_MAINTENANCE'
                    ? '#e11d48'
                    : '#f59e0b';
              const isSelected = activeAsset?.id === asset.id;

              return (
                <CircleMarker
                  key={asset.id}
                  center={[gps.latitude, gps.longitude]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{ color: '#ffffff', fillColor: color, fillOpacity: 1, weight: isSelected ? 3 : 2 }}
                  eventHandlers={{
                    click: () => {
                      setSelectedAssetId(asset.id);
                      onSelectAsset?.(asset);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} permanent>
                    <span className="font-mono font-bold">{asset.assetTag}</span>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          {filteredAssets.filter(isValidGpsLocation).length === 0 && (
            <div className="absolute inset-x-4 bottom-4 z-[20] mx-auto max-w-lg rounded-lg border border-amber-300 bg-amber-50/95 px-4 py-3 text-center text-xs text-amber-900 shadow-lg">
              No valid GPS coordinates match this filter. The map shows site locations, not equipment positions.
            </div>
          )}

          {/* Map Legend Bar */}
          <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-3 z-10 mt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-white">Fleet Status:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Available ({mappedAssets.filter((a) => a.status === 'AVAILABLE').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Rented ({mappedAssets.filter((a) => a.status === 'RENTED').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>In maintenance ({mappedAssets.filter((a) => a.status === 'IN_MAINTENANCE').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Reserved ({mappedAssets.filter((a) => a.status === 'RESERVED').length})</span>
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              Valid GPS coordinates: <strong className="text-amber-400">{filteredAssets.filter(isValidGpsLocation).length}</strong> of {filteredAssets.length} units
            </div>
          </div>
        </div>

        {/* Selected Equipment Telematics Panel (col-span-4) */}
        <div className="lg:col-span-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between text-xs text-white">
          {activeAsset ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {activeAsset.assetTag}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                    {activeAsset.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {activeAsset.brand} · {activeAsset.model} · SN: <span className="font-mono">{activeAsset.serialNumber}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${getStatusBadge(activeAsset.status).color}`}>
                  {getStatusBadge(activeAsset.status).label}
                </span>
              </div>

              {/* Telematics Key Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Engine Ignition Status</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`w-2 h-2 rounded-full ${activeAsset.gpsLocation?.ignitionOn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span className={activeAsset.gpsLocation?.ignitionOn ? 'text-emerald-400' : 'text-slate-400'}>
                      {!isValidGpsLocation(activeAsset)
                        ? 'DATA UNAVAILABLE'
                        : activeAsset.gpsLocation?.ignitionOn
                          ? 'ENGINE ON'
                          : 'ENGINE OFF'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Speed: {isValidGpsLocation(activeAsset) && activeAsset.gpsLocation?.speedKmh != null
                      ? `${activeAsset.gpsLocation.speedKmh} km/h`
                      : '—'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hour Meter (HM)</span>
                  <div className="text-sm font-bold font-mono text-amber-300">
                    {activeAsset.legalDocs?.hourMeter?.toLocaleString() || '2,450.5'} HM
                  </div>
                  <span className="text-[10px] text-slate-500">Cumulative usage</span>
                </div>
              </div>

              {/* Exact Geographical Coordinates Box */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Current Field Location:
                  </span>
                  <span className={`text-[10px] font-mono ${isValidGpsLocation(activeAsset) ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isValidGpsLocation(activeAsset) ? 'GPS AVAILABLE' : 'GPS UNAVAILABLE'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white">
                  {isValidGpsLocation(activeAsset)
                    ? activeAsset.gpsLocation?.siteName || activeAsset.warehouseLocation
                    : 'GPS location not received'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isValidGpsLocation(activeAsset)
                    ? [activeAsset.gpsLocation?.cityName, activeAsset.gpsLocation?.provinceName].filter(Boolean).join(', ') || 'Region unavailable'
                    : `Administrative location: ${activeAsset.warehouseLocation || 'Not specified'}`}
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Latitude:</span>
                    <span className="font-semibold text-slate-200">
                      {isValidGpsLocation(activeAsset) ? activeAsset.gpsLocation.latitude.toFixed(6) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Longitude:</span>
                    <span className="font-semibold text-slate-200">
                      {isValidGpsLocation(activeAsset) ? activeAsset.gpsLocation.longitude.toFixed(6) : '—'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Last GPS Ping: {isValidGpsLocation(activeAsset) && activeAsset.gpsLocation?.lastGpsPing
                    ? new Date(activeAsset.gpsLocation.lastGpsPing).toLocaleString('en-US')
                    : 'Unavailable'}
                </div>
              </div>

              {/* Legal Documents Quick Status */}
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Equipment Document Status:</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {activeAsset.legalDocs?.documentStatus || 'VALID'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
                  <div>Plate: <span className="text-slate-200 font-semibold">{activeAsset.legalDocs?.plateNumber || 'B 9821 TQ'}</span></div>
                  <div>SIA: <span className="text-slate-200 font-semibold">{activeAsset.legalDocs?.siaNumber || 'SIA-2026-K3'}</span></div>
                </div>
              </div>

              {/* Navigation & Action Links */}
              <div className="pt-2 space-y-2">
                {onOpenLegalDocs && (
                  <button
                    type="button"
                    onClick={() => onOpenLegalDocs(activeAsset)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Dokumen Legalitas (STNK/BPKB/SIA)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select an equipment marker on the map to view live telematics data.
            </div>
          )}

          {/* Site Quick Switcher Drawer */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
              Jump to Project Site:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {Object.entries(DEFAULT_SITES).map(([k, s]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSiteFilter(k)}
                  className={`p-1.5 rounded text-left truncate transition-colors ${
                    siteFilter === k
                      ? 'bg-amber-400 text-slate-900 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
