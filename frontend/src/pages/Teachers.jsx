import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import TeacherCard from '../components/TeacherCard';
import FilterBar from '../components/FilterBar';
import TeacherMap, { getCoordinates } from '../components/TeacherMap';
import TeacherCardSkeleton from '../components/TeacherCardSkeleton';
import { HiOutlineSearch, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

const scoreTeacherMatch = (teacher, preferences) => {
  const { subject, state, district, city, minFee, maxFee, time } = preferences;
  const teacherSubjects = (teacher.subjects || []).map((value) => value.toLowerCase());
  const subjectMatch = subject ? teacherSubjects.includes(subject.toLowerCase()) ? 1 : 0 : 0.5;
  const areaMatch = city
    ? teacher.location?.city?.toLowerCase() === city.toLowerCase() ? 1 : 0
    : district
    ? teacher.location?.district?.toLowerCase() === district.toLowerCase() ? 1 : 0
    : state
    ? teacher.location?.state?.toLowerCase() === state.toLowerCase() ? 1 : 0
    : 0.5;
  const fee = Number(teacher.feePerHour);
  const hasBudget = minFee || maxFee;
  const budgetMatch = hasBudget
    ? (!minFee || fee >= Number(minFee)) && (!maxFee || fee <= Number(maxFee)) ? 1 : 0
    : 0.5;
  const availability = `${teacher.availability || ''} ${(teacher.availabilitySlots || []).map((slot) => `${slot.day} ${slot.start} ${slot.end}`).join(' ')}`.toLowerCase();
  const timeMatch = time ? availability.includes(time.toLowerCase()) ? 1 : 0.35 : 0.5;
  return Math.round((subjectMatch * 40 + areaMatch * 25 + budgetMatch * 20 + timeMatch * 15) * 0.98);
};

// Demo data used when backend is not available
const DEMO_TEACHERS = [
  {
    _id: 'demo1',
    name: 'Priya Sharma',
    degree: 'M.Sc Mathematics',
    subjects: ['Mathematics', 'Physics'],
    experience: 8,
    feePerHour: 500,
    location: { city: 'Baner', district: 'Pune', state: 'Maharashtra' },
    averageRating: 4.8,
    bio: 'Passionate about making maths easy and fun for students of all levels.',
  },
  {
    _id: 'demo2',
    name: 'Rahul Verma',
    degree: 'B.Tech CSE',
    subjects: ['Computer Science', 'Coding / Programming'],
    experience: 5,
    feePerHour: 600,
    location: { city: 'Whitefield', district: 'Bangalore', state: 'Karnataka' },
    averageRating: 4.6,
    bio: 'Software engineer turned educator. Specializes in Python, Java & competitive coding.',
  },
  {
    _id: 'demo3',
    name: 'Ananya Reddy',
    degree: 'M.A English Literature',
    subjects: ['English', 'Spoken English'],
    experience: 10,
    feePerHour: 450,
    location: { city: 'Jubilee Hills', district: 'Hyderabad', state: 'Telangana' },
    averageRating: 4.9,
    bio: 'Help students improve communication skills and ace board exams.',
  },
  {
    _id: 'demo4',
    name: 'Dr. Suresh Kumar',
    degree: 'Ph.D Chemistry',
    subjects: ['Chemistry', 'Competitive Exams (JEE/NEET)'],
    experience: 15,
    feePerHour: 800,
    location: { city: 'Saket', district: 'New Delhi', state: 'Delhi' },
    averageRating: 4.7,
    bio: 'Former college professor. Expert in organic chemistry and NEET preparation.',
  },
  {
    _id: 'demo5',
    name: 'Meera Patel',
    degree: 'B.Com, CA Intermediate',
    subjects: ['Accountancy', 'Economics', 'Business Studies'],
    experience: 6,
    feePerHour: 550,
    location: { city: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat' },
    averageRating: 4.5,
    bio: 'Commerce expert helping Class 11-12 and CA foundation students.',
  },
  {
    _id: 'demo6',
    name: 'Arjun Singh',
    degree: 'M.Tech Mechanical',
    subjects: ['Physics', 'Mathematics', 'Competitive Exams (JEE/NEET)'],
    experience: 7,
    feePerHour: 700,
    location: { city: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan' },
    averageRating: 4.4,
    bio: 'IIT coaching experience. Focus on concepts and problem-solving speed.',
  },
  {
    _id: 'demo7',
    name: 'Sneha Iyer',
    degree: 'M.Sc Biology',
    subjects: ['Biology', 'Chemistry'],
    experience: 4,
    feePerHour: 400,
    location: { city: 'T Nagar', district: 'Chennai', state: 'Tamil Nadu' },
    averageRating: 4.6,
    bio: 'Patient and thorough. Ideal for CBSE and State board students.',
  },
  {
    _id: 'demo8',
    name: 'Vikram Joshi',
    degree: 'M.A Hindi',
    subjects: ['Hindi', 'Sanskrit'],
    experience: 12,
    feePerHour: 350,
    location: { city: 'Gomti Nagar', district: 'Lucknow', state: 'Uttar Pradesh' },
    averageRating: 4.3,
    bio: 'Experienced language teacher for school and competitive exams.',
  },
];

const Teachers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    state: searchParams.get('state') || '',
    district: searchParams.get('district') || '',
    city: searchParams.get('city') || '',
    subject: searchParams.get('subject') || '',
    minFee: searchParams.get('minFee') || '',
    maxFee: searchParams.get('maxFee') || '',
    minExp: searchParams.get('minExp') || '',
  });
  const [view, setView] = useState('grid'); // grid | list
  const [useDemo, setUseDemo] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [preferredTime, setPreferredTime] = useState(searchParams.get('time') || '');
  const [sortMode, setSortMode] = useState('match');

  const nearbyTeachers = nearbyOnly && userLocation
    ? teachers.filter((teacher) => {
        const coordinates = getCoordinates(teacher);
        if (!coordinates) return false;
        const [lat, lng] = coordinates;
        const [userLat, userLng] = userLocation;
        const latDistance = (lat - userLat) * 111;
        const lngDistance = (lng - userLng) * 111 * Math.cos((userLat * Math.PI) / 180);
        return Math.sqrt(latDistance ** 2 + lngDistance ** 2) <= 2;
      })
    : teachers;

  const visibleTeachers = nearbyTeachers
    .map((teacher) => ({
      ...teacher,
      matchScore: scoreTeacherMatch(teacher, { ...filters, time: preferredTime }),
      distanceKm: userLocation && getCoordinates(teacher)
        ? Math.sqrt((((getCoordinates(teacher)[0] - userLocation[0]) * 111) ** 2) + (((getCoordinates(teacher)[1] - userLocation[1]) * 111 * Math.cos((userLocation[0] * Math.PI) / 180)) ** 2))
        : undefined
    }))
    .sort((a, b) => sortMode === 'match' ? b.matchScore - a.matchScore : 0);

  const findNearby = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setNearbyOnly(true);
        setMapMode(true);
        setLocationMessage('Showing teachers within 2 km from you.');
      },
      () => setLocationMessage('Allow location access to find teachers within 2 km.')
    );
  };

  const fetchTeachers = useCallback(async (activeFilters = filters, query = search) => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.q = query;
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });

      const { data } = await api.get('/teachers', { params });
      setTeachers(data.teachers || data || []);
      setUseDemo(false);
    } catch {
      // Backend not ready — use demo + client-side filter
      setUseDemo(true);
      let list = [...DEMO_TEACHERS];

      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.subjects.some((s) => s.toLowerCase().includes(q)) ||
            t.degree?.toLowerCase().includes(q)
        );
      }
      if (activeFilters.state) list = list.filter((t) => t.location?.state === activeFilters.state);
      if (activeFilters.district)
        list = list.filter((t) => t.location?.district === activeFilters.district);
      if (activeFilters.city) list = list.filter((t) => t.location?.city === activeFilters.city);
      if (activeFilters.subject)
        list = list.filter((t) => t.subjects.includes(activeFilters.subject));
      if (activeFilters.minFee)
        list = list.filter((t) => t.feePerHour >= Number(activeFilters.minFee));
      if (activeFilters.maxFee)
        list = list.filter((t) => t.feePerHour <= Number(activeFilters.maxFee));
      if (activeFilters.minExp)
        list = list.filter((t) => t.experience >= Number(activeFilters.minExp));

      setTeachers(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers(filters, search);
  }, []);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    // Update URL
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
    fetchTeachers(newFilters, search);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set('q', search);
    else params.delete('q');
    setSearchParams(params);
    fetchTeachers(filters, search);
  };

  const handleTimeChange = (event) => {
    const value = event.target.value;
    setPreferredTime(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('time', value);
    else params.delete('time');
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Find Offline Teachers
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Browse verified tutors near you. Filter by location, subject and fees.
        </p>
        {useDemo && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block">
            Showing demo data — connect backend to load real teachers.
          </p>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-xl">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input-field pl-12 pr-24 py-3"
            placeholder="Search by name, subject or qualification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-sm"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/60">
        <div>
          <label htmlFor="preferred-time" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Preferred time</label>
          <input id="preferred-time" value={preferredTime} onChange={handleTimeChange} className="input-field mt-1 w-48 bg-white" placeholder="e.g. evening, Mon" />
        </div>
        <div>
          <label htmlFor="match-sort" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Sort teachers</label>
          <select id="match-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="input-field mt-1 w-48 bg-white">
            <option value="match">Best match</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
        <p className="pb-2 text-xs text-gray-600 dark:text-gray-300">Matches consider subject, area, budget, and availability.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-72 shrink-0">
          <FilterBar filters={filters} setFilters={setFilters} onApply={handleApplyFilters} />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Loading...' : `${visibleTeachers.length} teacher${visibleTeachers.length !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button onClick={findNearby} className="btn-secondary py-2 px-3 text-sm">Near me: 2 km</button>
              <button onClick={() => setMapMode((current) => !current)} className="btn-secondary py-2 px-3 text-sm">
                {mapMode ? 'List view' : 'Map view'}
              </button>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-md transition ${
                  view === 'grid' ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-500'
                }`}
              >
                <HiOutlineViewGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition ${
                  view === 'list' ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-500'
                }`}
              >
                <HiOutlineViewList className="w-5 h-5" />
              </button>
              </div>
            </div>
          </div>

          {locationMessage && <p className="mb-4 text-sm text-primary-700 dark:text-primary-300">{locationMessage}</p>}
          {mapMode && !loading && <div className="mb-6"><TeacherMap teachers={visibleTeachers} userLocation={userLocation} /></div>}

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <TeacherCardSkeleton key={i} />)}
            </div>
          ) : visibleTeachers.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No teachers found</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search term.</p>
              <button
                onClick={() => handleApplyFilters({ state: '', district: '', city: '', subject: '', minFee: '', maxFee: '', minExp: '' })}
                className="btn-primary mt-4"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              className={
                view === 'grid'
                  ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {visibleTeachers.map((t) => (
                <TeacherCard key={t._id} teacher={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teachers;
