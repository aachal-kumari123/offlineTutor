import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

const teacherIcon = L.divIcon({
  className: 'teacher-map-pin',
  html: '<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:#e85d3f;border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px #33415599"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 18]
});

const userIcon = L.divIcon({
  className: 'user-map-pin',
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 0 0 5px #2563eb55"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const CITY_COORDINATES = {
  Baner: [18.559, 73.786],
  Pune: [18.5204, 73.8567],
  Whitefield: [12.9698, 77.75],
  Bangalore: [12.9716, 77.5946],
  'Jubilee Hills': [17.4319, 78.4075],
  Hyderabad: [17.385, 78.4867],
  Saket: [28.5245, 77.2066],
  'New Delhi': [28.6139, 77.209],
  Navrangpura: [23.035, 72.560],
  Ahmedabad: [23.0225, 72.5714],
  'Malviya Nagar': [26.8508, 75.806],
  Jaipur: [26.9124, 75.7873],
  'T Nagar': [13.0418, 80.2341],
  Chennai: [13.0827, 80.2707],
  'Gomti Nagar': [26.855, 81.002],
  Lucknow: [26.8467, 80.9462],
};

const getCoordinates = (teacher) => {
  const coordinates = teacher.location?.coordinates;
  if (coordinates?.lat && coordinates?.lng) return [coordinates.lat, coordinates.lng];
  return CITY_COORDINATES[teacher.location?.city] || null;
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 0.8 });
  }, [center, map]);
  return null;
};

const TeacherMap = ({ teachers, userLocation }) => {
  const points = teachers
    .map((teacher) => ({ teacher, coordinates: getCoordinates(teacher) }))
    .filter((point) => point.coordinates);
  const center = userLocation || points[0]?.coordinates || [20.5937, 78.9629];

  return (
    <div className="overflow-hidden rounded-xl border border-orange-100 dark:border-gray-700 shadow-md">
      <MapContainer center={center} zoom={userLocation ? 12 : 5} scrollWheelZoom className="h-[480px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={userLocation} />
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Your location</Popup>
          </Marker>
        )}
        {points.map(({ teacher, coordinates }) => (
          <Marker key={teacher._id} position={coordinates} icon={teacherIcon}>
            <Popup>
              <div className="min-w-[170px]">
                <strong>{teacher.name}</strong>
                <p className="text-xs text-slate-500">{teacher.location?.city || 'Nearby'}</p>
                <Link className="text-xs font-semibold text-indigo-600" to={`/teachers/${teacher._id}`}>
                  View profile
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {!points.length && (
        <p className="bg-white p-4 text-sm text-slate-600">Teachers need a city or map location to appear here.</p>
      )}
    </div>
  );
};

export { CITY_COORDINATES, getCoordinates };
export default TeacherMap;
