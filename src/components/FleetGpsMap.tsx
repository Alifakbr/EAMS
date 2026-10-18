import { exportCsv } from '../utils/download.ts';
<<<<<<< HEAD
import React, { useEffect, useState, useMemo } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
=======
import React, { useState, useMemo } from 'react';
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
<<<<<<< HEAD
=======
  // Canvas coordinate projection percentage (0 - 100)
  mapX: number;
  mapY: number;
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
}

const DEFAULT_SITES: Record<string, SiteLocation> = {
  morowali: {
    id: 'morowali',
<<<<<<< HEAD
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
=======
    name: 'Site Project Morowali (Nikel & Smelter)',
    city: 'Morowali',
    province: 'Sulawesi Tengah',
    latitude: -2.545,
    longitude: 121.353,
    description: 'Kawasan Industri Smelter & Tambang Nikel Terpadu Blok B',
    mapX: 62.5,
    mapY: 53.0,
  },
  balikpapan: {
    id: 'balikpapan',
    name: 'Depot & Workshop Utama Balikpapan',
    city: 'Balikpapan',
    province: 'Kalimantan Timur',
    latitude: -1.265,
    longitude: 116.831,
    description: 'Depot Logistik, Workshop Servis Berat & Pool Alat Kalimantan',
    mapX: 51.5,
    mapY: 48.0,
  },
  ikn: {
    id: 'ikn',
    name: 'Site IKN Nusantara Dermaga 2',
    city: 'Sepaku, Penajam',
    province: 'Kalimantan Timur',
    latitude: -0.965,
    longitude: 116.711,
    description: 'Proyek Infrastruktur Dermaga & Jembatan Pulau Balang IKN',
    mapX: 50.8,
    mapY: 45.0,
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  },
  wedabay: {
    id: 'wedabay',
    name: 'Site Weda Bay Halmahera',
    city: 'Halmahera Tengah',
<<<<<<< HEAD
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
=======
    province: 'Maluku Utara',
    latitude: 0.472,
    longitude: 127.954,
    description: 'Operasi Penambangan Bijih & Logistik Pelabuhan Khusus',
    mapX: 78.5,
    mapY: 38.0,
  },
  jakarta: {
    id: 'jakarta',
    name: 'Kantor Pusat & Pool Cikarang Jakarta',
    city: 'Jakarta / Cikarang',
    province: 'DKI Jakarta & Jawa Barat',
    latitude: -6.208,
    longitude: 106.845,
    description: 'Headquarters Hub, Inspeksi Aset & Staging Distribusi Jawa',
    mapX: 28.5,
    mapY: 72.0,
  },
  surabaya: {
    id: 'surabaya',
    name: 'Cabang & Workshop Depot Surabaya Gresik',
    city: 'Surabaya & Gresik',
    province: 'Jawa Timur',
    latitude: -7.257,
    longitude: 112.752,
    description: 'Workshop Rekondisi, Gudang Suku Cadang & Crane Yard',
    mapX: 42.0,
    mapY: 77.0,
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  },
  timika: {
    id: 'timika',
    name: 'Site Project Timika Grasberg Corridor',
    city: 'Timika',
<<<<<<< HEAD
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
    <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-white shadow-lg">
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

=======
    province: 'Papua Tengah',
    latitude: -4.546,
    longitude: 136.883,
    description: 'Armada Khusus Tambang Dataran Tinggi & Portsite Amamapare',
    mapX: 92.0,
    mapY: 67.0,
  },
};

>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
export const FleetGpsMap: React.FC<FleetGpsMapProps> = ({
  assets,
  onSelectAsset,
  onOpenLegalDocs,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('AST-10024');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
<<<<<<< HEAD
  const [showTopoView, setShowTopoView] = useState(false);
=======
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSatelliteView, setShowSatelliteView] = useState(false);
  const [selectedPinAsset, setSelectedPinAsset] = useState<Asset | null>(null);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

  // Map projection resolver for assets
  const mappedAssets = useMemo(() => {
    return assets.map((asset) => {
<<<<<<< HEAD
      const loc = asset.gpsLocation;
=======
      let loc = asset.gpsLocation;
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      let siteKey = 'morowali';
      const locText = `${asset.warehouseLocation} ${loc?.siteName || ''} ${loc?.cityName || ''}`.toLowerCase();

      if (locText.includes('ikn') || locText.includes('nusantara')) siteKey = 'ikn';
      else if (locText.includes('balikpapan') || locText.includes('kalimantan')) siteKey = 'balikpapan';
      else if (locText.includes('weda') || locText.includes('halmahera')) siteKey = 'wedabay';
      else if (locText.includes('jakarta') || locText.includes('cikarang')) siteKey = 'jakarta';
      else if (locText.includes('surabaya') || locText.includes('gresik')) siteKey = 'surabaya';
      else if (locText.includes('timika') || locText.includes('papua') || locText.includes('freeport')) siteKey = 'timika';

      const site = DEFAULT_SITES[siteKey] || DEFAULT_SITES.morowali;

<<<<<<< HEAD
      return {
        ...asset,
        siteKey,
        siteInfo: site,
=======
      // Add deterministic small offset so overlapping pins in the same site fan out slightly
      const hash = asset.assetTag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const offsetX = ((hash % 7) - 3) * 1.6;
      const offsetY = (((hash >> 2) % 7) - 3) * 1.6;

      const currentGps = loc || {
        latitude: site.latitude + (offsetY * 0.05),
        longitude: site.longitude + (offsetX * 0.05),
        siteName: site.name,
        cityName: site.city,
        provinceName: site.province,
        lastGpsPing: new Date().toISOString(),
        speedKmh: asset.status === 'AVAILABLE' ? 0 : (asset.status === 'RENTED' ? 14 : 0),
        ignitionOn: asset.status !== 'IN_MAINTENANCE',
      };

      return {
        ...asset,
        gpsLocation: currentGps,
        siteKey,
        siteInfo: site,
        mapX: Math.max(5, Math.min(95, site.mapX + offsetX)),
        mapY: Math.max(10, Math.min(90, site.mapY + offsetY)),
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
<<<<<<< HEAD
        return { label: 'Available', color: 'bg-emerald-500 text-white', border: 'border-emerald-600', ring: 'ring-emerald-400' };
      case 'RENTED':
        return { label: 'Rented', color: 'bg-blue-600 text-white', border: 'border-blue-700', ring: 'ring-blue-400' };
      case 'IN_MAINTENANCE':
        return { label: 'In Maintenance', color: 'bg-rose-600 text-white', border: 'border-rose-700', ring: 'ring-rose-400' };
      case 'RESERVED':
        return { label: 'Reserved', color: 'bg-amber-500 text-white', border: 'border-amber-600', ring: 'ring-amber-400' };
=======
        return { label: 'Tersedia (Ready)', color: 'bg-emerald-500 text-white', border: 'border-emerald-600', ring: 'ring-emerald-400' };
      case 'RENTED':
        return { label: 'Sedang Disewa (Rented)', color: 'bg-blue-600 text-white', border: 'border-blue-700', ring: 'ring-blue-400' };
      case 'IN_MAINTENANCE':
        return { label: 'Servis / Perbaikan', color: 'bg-rose-600 text-white', border: 'border-rose-700', ring: 'ring-rose-400' };
      case 'RESERVED':
        return { label: 'Dipesan (Reserved)', color: 'bg-amber-500 text-white', border: 'border-amber-600', ring: 'ring-amber-400' };
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      default:
        return { label: status, color: 'bg-slate-600 text-white', border: 'border-slate-700', ring: 'ring-slate-400' };
    }
  };

  // Export to Excel / CSV
  const handleExportLocations = () => {
    const headers = [
      'Asset Tag',
<<<<<<< HEAD
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
=======
      'Nama Alat Berat',
      'Kategori',
      'Status Operasi',
      'Site Project / Lokasi',
      'Kota & Provinsi',
      'Latitude',
      'Longitude',
      'Hour Meter (HM)',
      'Kontak Mesin',
      'Kecepatan (km/h)',
      'Nomor Polisi / Plat',
      'Terakhir Ping GPS',
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    ];

    const rows = filteredAssets.map((a) => [
      a.assetTag,
      `${a.name}`,
      `${a.category}`,
      a.status,
      `${a.siteInfo?.name || a.warehouseLocation}`,
<<<<<<< HEAD
      `${a.gpsLocation?.cityName || ''}, ${a.gpsLocation?.provinceName || ''}`,
      isValidGpsLocation(a) ? a.gpsLocation.latitude.toFixed(6) : '',
      isValidGpsLocation(a) ? a.gpsLocation.longitude.toFixed(6) : '',
=======
      `${a.siteInfo?.city || ''}, ${a.siteInfo?.province || ''}`,
      a.gpsLocation?.latitude?.toFixed(6) || '',
      a.gpsLocation?.longitude?.toFixed(6) || '',
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      a.legalDocs?.hourMeter || 0,
      a.gpsLocation?.ignitionOn ? 'ON' : 'OFF',
      a.gpsLocation?.speedKmh || 0,
      a.legalDocs?.plateNumber || '-',
<<<<<<< HEAD
      isValidGpsLocation(a) ? a.gpsLocation?.lastGpsPing || '' : '',
=======
      a.gpsLocation?.lastGpsPing || new Date().toISOString(),
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    ]);

    exportCsv(`EARMS_Fleet_GPS_Locations_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
<<<<<<< HEAD
    <div data-print-area className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-0">
=======
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden space-y-0">
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      {/* Top Map Header & Telematics Toolbar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Navigation className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
<<<<<<< HEAD
              Live Heavy Equipment GPS Fleet Map
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              OpenStreetMap
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            OpenStreetMap base layer. Markers appear only for units with valid GPS coordinates.
=======
              Peta Aktual Lokasi Alat Berat (Live Fleet GPS Telematics)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Satellite Feed
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Visualisasi peta aktual persebaran armada alat berat, status mesin, koordinat GPS lapangan, dan lokasi proyek klien secara real-time.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </p>
        </div>

        {/* Action Controls */}
<<<<<<< HEAD
        <div className="no-print flex items-center gap-2 flex-wrap">
=======
        <div className="flex items-center gap-2 flex-wrap">
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          <button
            type="button"
            onClick={handleExportLocations}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-xs transition-colors"
<<<<<<< HEAD
            title="Export all fleet locations to Excel / CSV"
=======
            title="Download Data Lokasi Seluruh Armada ke Excel / CSV"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-xs transition-colors"
<<<<<<< HEAD
            title="Print the fleet location map or save it as a PDF"
=======
            title="Cetak Peta Posisi Armada ke Printer / PDF"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print Map (PDF)</span>
          </button>

          <button
            type="button"
<<<<<<< HEAD
            onClick={() => setShowTopoView(!showTopoView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-colors ${
              showTopoView
=======
            onClick={() => setShowSatelliteView(!showSatelliteView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-colors ${
              showSatelliteView
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                ? 'bg-amber-400 text-slate-900 border-amber-300'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
<<<<<<< HEAD
            <span>{showTopoView ? 'OSM Topographic View' : 'OSM Street View'}</span>
=======
            <span>{showSatelliteView ? 'Mode Satelit' : 'Mode Topo Terrain'}</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </button>
        </div>
      </div>

      {/* Filter and Site Selector Bar */}
<<<<<<< HEAD
      <div className="no-print p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
=======
      <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        <div className="sm:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
<<<<<<< HEAD
            placeholder="Search equipment (tag, name, plate, brand)..."
=======
            placeholder="Cari unit (Tag, Nama, Plat, Brand)..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
<<<<<<< HEAD
            <option value="ALL">All project sites / depots ({mappedAssets.length} units)</option>
=======
            <option value="ALL">Semua Site Proyek / Depot ({mappedAssets.length} Unit)</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            {Object.entries(DEFAULT_SITES).map(([k, s]) => {
              const count = mappedAssets.filter((a) => a.siteKey === k).length;
              return (
                <option key={k} value={k}>
<<<<<<< HEAD
                  {s.name} ({count} units)
=======
                  {s.name} ({count} Unit)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
<<<<<<< HEAD
            <option value="ALL">All fleet statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="IN_MAINTENANCE">In maintenance</option>
            <option value="RESERVED">Reserved</option>
=======
            <option value="ALL">Semua Status Armada</option>
            <option value="AVAILABLE">Tersedia (Ready)</option>
            <option value="RENTED">Sedang Disewa (Rented)</option>
            <option value="IN_MAINTENANCE">Dalam Servis (Maintenance)</option>
            <option value="RESERVED">Dipesan (Reserved)</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </select>
        </div>
      </div>

      {/* Main Map View Area & Sidebar Telematics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-slate-950 relative">
<<<<<<< HEAD
        <div className="lg:col-span-8 relative min-h-[460px] overflow-hidden">
          <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-white text-[11px] shadow-lg">
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
            className="h-[460px] w-full bg-slate-950"
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
            <div className="absolute inset-x-4 bottom-4 z-[1000] mx-auto max-w-lg rounded-lg border border-amber-300 bg-amber-50/95 px-4 py-3 text-center text-xs text-amber-900 shadow-lg">
              No valid GPS coordinates match this filter. The map shows site locations, not equipment positions.
            </div>
          )}
=======
        {/* Interactive Visual Map Canvas (col-span-8 or 9) */}
        <div className="lg:col-span-8 relative overflow-hidden flex flex-col justify-between p-3 select-none">
          {/* Map Controls Floating Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-white text-[11px] shadow-lg">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold">Indonesian Archipelago Telematics Grid</span>
            <span className="text-slate-400">· WGS84 Datum</span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-white shadow-lg">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              className="px-2 py-1 hover:bg-slate-800 rounded font-bold text-xs"
              title="Perbesar Peta"
            >
              +
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-300">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
              className="px-2 py-1 hover:bg-slate-800 rounded font-bold text-xs"
              title="Perkecil Peta"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 hover:bg-slate-800 rounded text-[10px] font-medium text-amber-300"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* SVG Map Canvas Container */}
          <div
            className="w-full h-full min-h-[380px] sm:min-h-[440px] relative transition-transform duration-300 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* SVG Visual Geographical Map of Indonesia Archipelago */}
            <svg
              viewBox="0 0 1000 500"
              className={`w-full h-full max-h-[500px] ${
                showSatelliteView ? 'opacity-90' : 'opacity-95'
              }`}
            >
              {/* Background Ocean Gradients */}
              <defs>
                <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                </pattern>
                <filter id="markerShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
                </filter>
              </defs>

              <rect width="1000" height="500" fill="url(#oceanGlow)" />
              <rect width="1000" height="500" fill="url(#gridPattern)" />

              {/* Latitude / Equator Guides */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#334155" strokeWidth="0.8" strokeDasharray="6,4" />
              <text x="12" y="244" fill="#64748b" fontSize="10" fontFamily="monospace">Khatulistiwa / Equator (0° 00' N/S)</text>

              {/* Major Island Silhouettes */}
              {/* Sumatra */}
              <path
                d="M 120 130 C 145 150, 180 200, 215 250 C 235 280, 260 320, 275 340 C 265 350, 250 330, 220 280 C 180 220, 140 170, 105 140 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Java */}
              <path
                d="M 260 370 C 310 375, 360 378, 410 382 C 430 384, 450 382, 445 392 C 390 392, 330 390, 265 385 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Kalimantan */}
              <path
                d="M 450 170 C 490 160, 550 180, 560 230 C 565 260, 540 300, 500 320 C 460 325, 420 300, 425 250 C 430 200, 440 180, 450 170 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Sulawesi */}
              <path
                d="M 610 200 C 630 190, 655 210, 640 235 C 625 250, 615 270, 630 290 C 640 305, 625 320, 610 310 C 595 290, 600 250, 610 200 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Maluku */}
              <path
                d="M 760 180 C 785 190, 775 220, 755 210 Z M 750 250 C 770 260, 765 280, 745 270 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Papua */}
              <path
                d="M 820 220 C 860 210, 920 230, 950 250 C 970 270, 960 340, 930 350 C 890 360, 860 320, 840 280 C 825 260, 810 235, 820 220 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
              />

              {/* Major Site Hub Rings */}
              {Object.entries(DEFAULT_SITES).map(([k, s]) => {
                const cx = s.mapX * 10;
                const cy = s.mapY * 5;
                const isSiteSelected = siteFilter === k;

                return (
                  <g key={s.id} className="cursor-pointer" onClick={() => setSiteFilter(k)}>
                    {/* Pulsing Site Hub Aura */}
                    <circle cx={cx} cy={cy} r={isSiteSelected ? 22 : 16} fill="none" stroke="#f59e0b" strokeWidth="1" opacity={isSiteSelected ? 0.8 : 0.4} strokeDasharray="3,3">
                      <animate attributeName="r" values="14;24;14" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={cx} cy={cy} r="4" fill="#f59e0b" />
                    {/* Label */}
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      className="pointer-events-none drop-shadow"
                    >
                      {s.city}
                    </text>
                  </g>
                );
              })}

              {/* Equipment Position Markers */}
              {filteredAssets.map((asset) => {
                const cx = asset.mapX * 10;
                const cy = asset.mapY * 5;
                const isSelected = activeAsset?.id === asset.id;
                const badge = getStatusBadge(asset.status);

                return (
                  <g
                    key={asset.id}
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setSelectedPinAsset(asset);
                      if (onSelectAsset) onSelectAsset(asset);
                    }}
                    className="cursor-pointer group"
                    filter="url(#markerShadow)"
                  >
                    {/* Selected Halo Ring */}
                    {isSelected && (
                      <circle cx={cx} cy={cy} r="20" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.9">
                        <animate attributeName="r" values="12;26;12" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Pin Outer Hex/Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 11 : 8.5}
                      fill={
                        asset.status === 'AVAILABLE'
                          ? '#10b981'
                          : asset.status === 'RENTED'
                          ? '#2563eb'
                          : asset.status === 'IN_MAINTENANCE'
                          ? '#e11d48'
                          : '#f59e0b'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    {/* Machine Pin Center Indicator */}
                    <circle cx={cx} cy={cy} r="3" fill="#ffffff" />

                    {/* Pin Tag Hover Banner */}
                    <g className="transition-opacity duration-200">
                      <rect
                        x={cx - 32}
                        y={cy + 12}
                        width="64"
                        height="16"
                        rx="3"
                        fill="#0f172a"
                        stroke={isSelected ? '#38bdf8' : '#334155'}
                        strokeWidth="1"
                        opacity={isSelected ? 0.95 : 0.8}
                      />
                      <text
                        x={cx}
                        y={cy + 23}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {asset.assetTag}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

          {/* Map Legend Bar */}
          <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-3 z-10 mt-2">
            <div className="flex items-center gap-3 flex-wrap">
<<<<<<< HEAD
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
=======
              <span className="font-semibold text-white">Status Armada:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Tersedia ({mappedAssets.filter((a) => a.status === 'AVAILABLE').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Sedang Disewa ({mappedAssets.filter((a) => a.status === 'RENTED').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Servis / Perbaikan ({mappedAssets.filter((a) => a.status === 'IN_MAINTENANCE').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Dipesan ({mappedAssets.filter((a) => a.status === 'RESERVED').length})</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
<<<<<<< HEAD
              Valid GPS coordinates: <strong className="text-amber-400">{filteredAssets.filter(isValidGpsLocation).length}</strong> of {filteredAssets.length} units
=======
              Total Unit Terpantau: <strong className="text-amber-400">{filteredAssets.length}</strong> dari {assets.length}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
<<<<<<< HEAD
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
=======
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Kontak Mesin</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`w-2 h-2 rounded-full ${activeAsset.gpsLocation?.ignitionOn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span className={activeAsset.gpsLocation?.ignitionOn ? 'text-emerald-400' : 'text-slate-400'}>
                      {activeAsset.gpsLocation?.ignitionOn ? 'MESIN MENYALA (ON)' : 'MESIN MATI (OFF)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Kecepatan: {activeAsset.gpsLocation?.speedKmh || 0} km/h</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>

                <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hour Meter (HM)</span>
                  <div className="text-sm font-bold font-mono text-amber-300">
                    {activeAsset.legalDocs?.hourMeter?.toLocaleString() || '2,450.5'} HM
                  </div>
<<<<<<< HEAD
                  <span className="text-[10px] text-slate-500">Cumulative usage</span>
=======
                  <span className="text-[10px] text-slate-500">Pemakaian kumulatif</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>

              {/* Exact Geographical Coordinates Box */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
<<<<<<< HEAD
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
=======
                    Lokasi Lapangan Aktual:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">GPS Locked</span>
                </div>

                <div className="text-xs font-semibold text-white">
                  {activeAsset.siteInfo?.name || activeAsset.warehouseLocation}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeAsset.siteInfo?.city}, {activeAsset.siteInfo?.province}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Latitude:</span>
<<<<<<< HEAD
                    <span className="font-semibold text-slate-200">
                      {isValidGpsLocation(activeAsset) ? activeAsset.gpsLocation.latitude.toFixed(6) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Longitude:</span>
                    <span className="font-semibold text-slate-200">
                      {isValidGpsLocation(activeAsset) ? activeAsset.gpsLocation.longitude.toFixed(6) : '—'}
                    </span>
=======
                    <span className="font-semibold text-slate-200">{activeAsset.gpsLocation?.latitude?.toFixed(6) || '-2.545000'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Longitude:</span>
                    <span className="font-semibold text-slate-200">{activeAsset.gpsLocation?.longitude?.toFixed(6) || '121.353000'}</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
<<<<<<< HEAD
                  Last GPS Ping: {isValidGpsLocation(activeAsset) && activeAsset.gpsLocation?.lastGpsPing
                    ? new Date(activeAsset.gpsLocation.lastGpsPing).toLocaleString('en-US')
                    : 'Unavailable'}
=======
                  Ping Terakhir: {new Date(activeAsset.gpsLocation?.lastGpsPing || Date.now()).toLocaleTimeString('id-ID')} WITA
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>

              {/* Legal Documents Quick Status */}
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
<<<<<<< HEAD
                  <span className="font-semibold text-slate-300">Equipment Document Status:</span>
=======
                  <span className="font-semibold text-slate-300">Kelengkapan Dokumen Alat:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {activeAsset.legalDocs?.documentStatus || 'VALID'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
<<<<<<< HEAD
                  <div>Plate: <span className="text-slate-200 font-semibold">{activeAsset.legalDocs?.plateNumber || 'B 9821 TQ'}</span></div>
=======
                  <div>Plat: <span className="text-slate-200 font-semibold">{activeAsset.legalDocs?.plateNumber || 'B 9821 TQ'}</span></div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
<<<<<<< HEAD
              Select an equipment marker on the map to view live telematics data.
=======
              Pilih pin unit pada peta untuk melihat data telematics aktual.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </div>
          )}

          {/* Site Quick Switcher Drawer */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
<<<<<<< HEAD
              Jump to Project Site:
=======
              Lompat ke Site Proyek:
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
