import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import TeacherCard from '../components/TeacherCard';
import FilterBar from '../components/FilterBar';
import { HiOutlineSearch, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-72 shrink-0">
          <FilterBar filters={filters} setFilters={setFilters} onApply={handleApplyFilters} />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Loading...' : `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} found`}
            </p>
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

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card h-80 animate-pulse bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : teachers.length === 0 ? (
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
              {teachers.map((t) => (
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
