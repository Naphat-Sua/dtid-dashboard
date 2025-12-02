import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, Search } from 'lucide-react';
import { useThemeStore } from '../store/useStore';

// Custom marker icon
const createPickerIcon = () => {
  return L.divIcon({
    className: 'custom-picker-icon',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        transform: translate(-50%, -50%);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Map click handler component
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  });
  return null;
};

// Recenter map component
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 15);
    }
  }, [center, map]);
  return null;
};

const LocationPicker = ({ 
  value, 
  onChange, 
  placeholder = "Click on the map to select a location",
  error
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [selectedLocation, setSelectedLocation] = useState(value || null);
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Default center: Chiang Rai
  const defaultCenter = [20.15, 99.95];
  const defaultZoom = 10;

  // Map tile URLs
  const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const lightTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    onChange && onChange(location);
    
    // Reverse geocode to get address (using Nominatim)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          setAddress(data.display_name);
        }
      })
      .catch(() => {
        setAddress(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
      });
  }, [onChange]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCenterOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationSelect(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-2">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 
            ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search location..."
            className={`form-input pl-10 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${isDark 
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isSearching ? '...' : 'Search'}
        </button>
        <button
          type="button"
          onClick={handleCenterOnUser}
          title="Use my location"
          className={`p-2 rounded-lg transition-colors
            ${isDark 
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Map Container */}
      <div className={`relative rounded-lg overflow-hidden border-2 
        ${error 
          ? 'border-red-500' 
          : selectedLocation 
            ? isDark ? 'border-cyan-500' : 'border-blue-500'
            : isDark ? 'border-slate-600' : 'border-gray-300'}`}
        style={{ height: '250px' }}
      >
        <MapContainer
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
          zoom={selectedLocation ? 15 : defaultZoom}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url={isDark ? darkTileUrl : lightTileUrl}
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {selectedLocation && (
            <>
              <Marker 
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={createPickerIcon()}
              />
              <RecenterMap center={selectedLocation} />
            </>
          )}
        </MapContainer>

        {/* Overlay instruction */}
        {!selectedLocation && (
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none
            ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg
              ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-600'} shadow-lg`}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{placeholder}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm
          ${isDark ? 'bg-slate-800/50 text-slate-300' : 'bg-gray-50 text-gray-600'}`}>
          <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 
            ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
          <div>
            <p className="font-mono text-xs mb-1">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
            {address && (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {address}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export default LocationPicker;
