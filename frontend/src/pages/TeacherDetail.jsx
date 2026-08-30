import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineCurrencyRupee,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

// Demo fallback
const DEMO_MAP = {
  demo1: {
    _id: 'demo1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 11111',
    degree: 'M.Sc Mathematics',
    subjects: ['Mathematics', 'Physics'],
    experience: 8,
    feePerHour: 500,
    availability: 'Weekday evenings, Saturday mornings',
    location: { city: 'Baner', district: 'Pune', state: 'Maharashtra' },
    averageRating: 4.8,
    bio: 'Passionate about making maths easy and fun for students of all levels. I have helped over 200 students improve their grades significantly. My teaching style focuses on building strong fundamentals and problem-solving skills.',
    ratings: [
      { rating: 5, review: 'Excellent teacher! My daughter scored 95% in maths.', user: { name: 'Parent A' } },
      { rating: 5, review: 'Very patient and explains concepts clearly.', user: { name: 'Student B' } },
    ],
  },
  demo2: {
    _id: 'demo2',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    phone: '+91 98765 22222',
    degree: 'B.Tech CSE',
    subjects: ['Computer Science', 'Coding / Programming'],
    experience: 5,
    feePerHour: 600,
    availability: 'Flexible — evenings preferred',
    location: { city: 'Whitefield', district: 'Bangalore', state: 'Karnataka' },
    averageRating: 4.6,
    bio: 'Software engineer turned educator. Specializes in Python, Java & competitive coding. I prepare students for school curriculum as well as coding interviews.',
    ratings: [],
  },
  demo3: {
    _id: 'demo3',
    name: 'Ananya Reddy',
    email: 'ananya.reddy@example.com',
    degree: 'M.A English Literature',
    subjects: ['English', 'Spoken English'],
    experience: 10,
    feePerHour: 450,
    availability: 'Mon–Fri after 4 PM',
    location: { city: 'Jubilee Hills', district: 'Hyderabad', state: 'Telangana' },
    averageRating: 4.9,
    bio: 'Help students improve communication skills and ace board exams.',
    ratings: [],
  },
  demo4: {
    _id: 'demo4',
    name: 'Dr. Suresh Kumar',
    email: 'suresh.kumar@example.com',
    degree: 'Ph.D Chemistry',
    subjects: ['Chemistry', 'Competitive Exams (JEE/NEET)'],
    experience: 15,
    feePerHour: 800,
    availability: 'Weekends + weekday evenings',
    location: { city: 'Saket', district: 'New Delhi', state: 'Delhi' },
    averageRating: 4.7,
    bio: 'Former college professor. Expert in organic chemistry and NEET preparation.',
    ratings: [],
  },
  demo5: {
    _id: 'demo5',
    name: 'Meera Patel',
    degree: 'B.Com, CA Intermediate',
    subjects: ['Accountancy', 'Economics', 'Business Studies'],
    experience: 6,
    feePerHour: 550,
    location: { city: 'Navrangpura', district: 'Ahmedabad', state: 'Gujarat' },
    averageRating: 4.5,
    bio: 'Commerce expert helping Class 11-12 and CA foundation students.',
    ratings: [],
  },
  demo6: {
    _id: 'demo6',
    name: 'Arjun Singh',
    degree: 'M.Tech Mechanical',
    subjects: ['Physics', 'Mathematics', 'Competitive Exams (JEE/NEET)'],
    experience: 7,
    feePerHour: 700,
    location: { city: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan' },
    averageRating: 4.4,
    bio: 'IIT coaching experience. Focus on concepts and problem-solving speed.',
    ratings: [],
  },
  demo7: {
    _id: 'demo7',
    name: 'Sneha Iyer',
    degree: 'M.Sc Biology',
    subjects: ['Biology', 'Chemistry'],
    experience: 4,
    feePerHour: 400,
    location: { city: 'T Nagar', district: 'Chennai', state: 'Tamil Nadu' },
    averageRating: 4.6,
    bio: 'Patient and thorough. Ideal for CBSE and State board students.',
    ratings: [],
  },
  demo8: {
    _id: 'demo8',
    name: 'Vikram Joshi',
    degree: 'M.A Hindi',
    subjects: ['Hindi', 'Sanskrit'],
    experience: 12,
    feePerHour: 350,
    location: { city: 'Gomti Nagar', district: 'Lucknow', state: 'Uttar Pradesh' },
    averageRating: 4.3,
    bio: 'Experienced language teacher for school and competitive exams.',
    ratings: [],
  },
};

const TeacherDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/teachers/${id}`);
        setTeacher(data.teacher || data);
      } catch {
        // Demo fallback
        setTeacher(DEMO_MAP[id] || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onConnect = async (formData) => {
    if (!user) {
      toast.error('Please login as a student to connect with teachers');
      navigate('/login');
      return;
    }
    if (user.role === 'teacher') {
      toast.error('Teachers cannot send connection requests');
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/contact', {
        teacherId: id,
        message: formData.message,
        studentPhone: formData.phone || user.phone,
      });
      setSent(true);
      toast.success(
        data.emailSent
          ? 'Request sent! The teacher has been notified by email.'
          : 'Request sent, but the teacher email notification could not be sent.'
      );
      reset();
    } catch (err) {
      // Demo mode success
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setSent(true);
        toast.success('Request sent! (Demo mode — email would be sent when backend is live)');
        reset();
      } else {
        toast.error(err.response?.data?.message || 'Failed to send request');
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Teacher not found</h2>
        <Link to="/teachers" className="btn-primary">
          Back to Teachers
        </Link>
      </div>
    );
  }

  const loc = teacher.location
    ? [teacher.location.city, teacher.location.district, teacher.location.state].filter(Boolean).join(', ')
    : '—';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Teachers
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left — Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary-700 to-teal-700 relative">
              <div className="absolute -bottom-12 left-6">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-3xl font-bold text-primary-600">
                  {teacher.profileImage ? (
                    <img
                      src={teacher.profileImage}
                      alt={teacher.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    teacher.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
              </div>
            </div>
            <div className="pt-16 px-6 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {teacher.name}
                  </h1>
                  {teacher.degree && (
                    <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mt-1">
                      <HiOutlineAcademicCap className="w-5 h-5" />
                      {teacher.degree}
                    </p>
                  )}
                </div>
                {teacher.averageRating > 0 && (
                  <div className="flex items-center gap-1.5 bg-accent-50 dark:bg-accent-500/10 px-3 py-1.5 rounded-full">
                    <HiOutlineStar className="w-5 h-5 text-accent-500 fill-accent-500" />
                    <span className="font-bold">{teacher.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">
                      ({teacher.ratings?.length || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <HiOutlineLocationMarker className="w-4 h-4 text-primary-500" />
                  {loc}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineCurrencyRupee className="w-4 h-4 text-primary-500" />
                  ₹{teacher.feePerHour}/hour
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock className="w-4 h-4 text-primary-500" />
                  {teacher.experience}+ years experience
                </span>
              </div>

              {/* Subjects */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(teacher.subjects || []).map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-3">About</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {teacher.bio || 'No bio provided yet.'}
            </p>
            {teacher.availability && (
              <p className="mt-4 text-sm">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Availability: </span>
                <span className="text-gray-600 dark:text-gray-400">{teacher.availability}</span>
              </p>
            )}
          </div>

          {/* Reviews */}
          {teacher.ratings && teacher.ratings.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Reviews</h2>
              <div className="space-y-4">
                {teacher.ratings.map((r, i) => (
                  <div key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <HiOutlineStar
                            key={j}
                            className={`w-4 h-4 ${
                              j < r.rating ? 'text-accent-500 fill-accent-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{r.user?.name || 'Anonymous'}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{r.review}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Connect form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-1">Connect with {teacher.name?.split(' ')[0]}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Send a message. The teacher will receive an email notification.
            </p>

            {sent ? (
              <div className="text-center py-6">
                <HiOutlineCheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-green-700 dark:text-green-400">Request Sent!</p>
                <p className="text-sm text-gray-500 mt-1">
                  You will be contacted soon via email or phone.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="btn-secondary mt-4 text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onConnect)} className="space-y-4">
                {!user && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-3 rounded-lg">
                    Please{' '}
                    <Link to="/login" className="font-semibold underline">
                      login
                    </Link>{' '}
                    as a student to connect.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">Your Phone</label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="input-field pl-9"
                      placeholder="+91 98765 43210"
                      defaultValue={user?.phone || ''}
                      {...register('phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Message *</label>
                  <textarea
                    className="input-field resize-none"
                    rows={4}
                    placeholder="Hi, I am looking for a tutor for Class 10 Maths. Are you available?"
                    {...register('message', { required: 'Please write a short message' })}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sending || !user || user.role === 'teacher'}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Connection Request'}
                </button>
              </form>
            )}

            {/* Contact info (optional display) */}
            {(teacher.email || teacher.phone) && user && (
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-800 dark:text-gray-200">Contact (after connection)</p>
                {teacher.email && (
                  <p className="flex items-center gap-2">
                    <HiOutlineMail className="w-4 h-4" /> {teacher.email}
                  </p>
                )}
                {teacher.phone && (
                  <p className="flex items-center gap-2">
                    <HiOutlinePhone className="w-4 h-4" /> {teacher.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetail;
