import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { AlertType } from "./AlertCard";

export interface MapMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  title: string;
  type: AlertType;
}

export default function OceanMap({
  markers,
  center = [20.5937, 78.9629],
  zoom = 4,
}: {
  markers: MapMarker[];
  center?: LatLngExpression;
  zoom?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1a2332] shadow-lg">
      <MapContainer center={center} zoom={zoom} className="h-[320px] w-full md:h-[420px]">
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />
        {markers.map((m) => (
          <Marker key={m.id} position={m.position}>
            <Popup>
              <div className="text-sm bg-[#0f1625] text-white">
                <p className="font-semibold">{m.title}</p>
                <p className="text-gray-400">Type: {m.type}</p>
                <p className="mt-1 text-gray-400">Lat: {m.position[0].toFixed(2)}, Lng: {m.position[1].toFixed(2)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
