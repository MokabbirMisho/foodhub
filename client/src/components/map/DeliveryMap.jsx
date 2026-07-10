import { useEffect } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

const DORTMUND_CENTER = [51.5136, 7.4653];
const hasCoordinates = (location) =>
  Number.isFinite(location?.lat) && Number.isFinite(location?.lng);

function MapCenterUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

function DeliveryMap({
  deliveryLocation,
  height = '360px',
  restaurantLocation,
  riderLocation,
}) {
  const availableLocations = [
    riderLocation,
    deliveryLocation,
    restaurantLocation,
  ].filter(hasCoordinates);

  if (!availableLocations.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-stone-50 p-6 text-center text-zinc-700"
        style={{ minHeight: height }}
      >
        Location is not available yet.
      </div>
    );
  }

  const primaryLocation = hasCoordinates(riderLocation)
    ? riderLocation
    : availableLocations[0];
  const mapCenter = [primaryLocation.lat, primaryLocation.lng];
  const markers = [
    { label: 'Rider current location', location: riderLocation },
    { label: 'Restaurant', location: restaurantLocation },
    { label: 'Delivery address', location: deliveryLocation },
  ].filter(({ location }) => hasCoordinates(location));

  return (
    <div className="overflow-hidden rounded-xl" style={{ height }}>
      <MapContainer
        center={mapCenter || DORTMUND_CENTER}
        className="h-full w-full"
        scrollWheelZoom
        zoom={14}
      >
        <MapCenterUpdater center={mapCenter} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(({ label, location }) => (
          <Marker key={label} position={[location.lat, location.lng]}>
            <Popup>{label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default DeliveryMap;
