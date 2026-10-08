import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { getStates, getDistricts, getCities, subjectsList } from '../data/locations';
import { imageFileToDataUrl } from '../utils/image';
import { mediaFileToDataUrl } from '../utils/media';
import {
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi';

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [profileImage, setProfileImage] = useState('');
  const [demoVideo, setDemoVideo] = useState('');
  const [imageError, setImageError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register: registerUser, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      degree: '',
      experience: '',
      feePerHour: '',
      availability: '',
      bio: '',
      state: '',
      district: '',
      city: '',
    },
  });

  const watchState = watch('state');
  const watchDistrict = watch('district');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (watchState) {
      setDistricts(getDistricts(watchState));
      setValue('district', '');
      setValue('city', '');
      setCities([]);
    } else {
      setDistricts([]);
      setCities([]);
    }
  }, [watchState, setValue]);

  useEffect(() => {
    if (watchState && watchDistrict) {
      setCities(getCities(watchState, watchDistrict));
      setValue('city', '');
    } else {
      setCities([]);
    }
  }, [watchState, watchDistrict, setValue]);

  const toggleSubject = (sub) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(data.email, data.password);
        navigate(loggedUser.role === 'teacher' ? '/dashboard' : '/');
      } else {
        const payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          role,
          phone: data.phone || undefined,
          profileImage: profileImage || undefined,
          demoVideo: role === 'teacher' ? demoVideo || undefined : undefined,
        };

        if (role === 'teacher') {
          payload.degree = data.degree;
          payload.subjects = selectedSubjects;
          payload.experience = Number(data.experience) || 0;
          payload.feePerHour = Number(data.feePerHour) || 0;
          payload.availability = data.availability;
          payload.bio = data.bio;
          payload.location = {
            state: data.state,
            district: data.district,
            city: data.city,
          };
        }

        const newUser = await registerUser(payload);
        navigate(newUser.role === 'teacher' ? '/dashboard' : '/');
      }
    } catch {
      // toast already shown in context
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    reset();
    setSelectedSubjects([]);
    setProfileImage('');
    setDemoVideo('');
    setImageError('');
    setRole('student');
  };

  const handleVideoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImageError('');
      setDemoVideo(await mediaFileToDataUrl(file));
    } catch (error) {
      setDemoVideo('');
      setImageError(error.message);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImageError('');
      setProfileImage(await imageFileToDataUrl(file));
    } catch (error) {
      setProfileImage('');
      setImageError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] px-4 py-5 dark:bg-gray-950 sm:px-8 lg:flex lg:items-center lg:justify-center lg:py-8">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl shadow-orange-900/10 dark:bg-gray-900 lg:min-h-[650px] lg:flex-row">
      <section className="relative isolate min-h-[440px] overflow-hidden bg-[#fff7ef] text-slate-800 lg:min-h-0 lg:w-[53%] dark:bg-[#342318] dark:text-white">
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center opacity-15 blur-[2px]"
          style={{
            backgroundImage:
                "url('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=85')",
          }}
        />
              <div className="absolute inset-0 -z-10 bg-orange-50/85 dark:bg-orange-950/75" />
              <div className="absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-orange-200/60 blur-2xl dark:bg-orange-900/50" />
              <div className="absolute bottom-12 left-1/3 -z-10 h-44 w-72 rotate-12 rounded-[45%] bg-white/70 dark:bg-orange-800/30" />
        <div className="relative flex h-full min-h-[430px] flex-col p-8 sm:p-12 lg:p-14">
          <Link to="/" className="flex w-fit items-center gap-2 text-sm font-bold tracking-wide text-slate-700 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-orange-600/25">
              <HiOutlineAcademicCap className="h-5 w-5" />
            </span>
            Offline Tutor
          </Link>
          <div className="max-w-md animate-slide-up lg:mt-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-orange-300">Welcome to Offline Tutor</p>
            <h2 className="text-4xl font-black leading-tight text-slate-800 dark:text-white sm:text-5xl">Learn smarter,<br /><span className="text-primary-600">achieve more.</span></h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600 dark:text-white/70">
              Your all-in-one platform for finding trusted tutors, learning confidently, and building a brighter future.
            </p>
            <div className="mt-7 grid max-w-sm grid-cols-2 gap-x-5 gap-y-4 text-xs font-semibold text-slate-700 dark:text-white/80">
              <span className="flex items-center gap-2"><span className="rounded-md bg-white p-1.5 text-primary-600 shadow-sm">◇</span>Find expert tutors</span>
              <span className="flex items-center gap-2"><span className="rounded-md bg-white p-1.5 text-primary-600 shadow-sm">□</span>Learn at your pace</span>
              <span className="flex items-center gap-2"><span className="rounded-md bg-white p-1.5 text-primary-600 shadow-sm">↗</span>Track your progress</span>
              <span className="flex items-center gap-2"><span className="rounded-md bg-white p-1.5 text-primary-600 shadow-sm">☆</span>Achieve your goals</span>
            </div>
          </div>
          <div className="mt-auto hidden max-w-sm rounded-xl bg-white/70 p-4 text-xs leading-5 text-slate-600 shadow-sm dark:bg-white/10 dark:text-white/70 sm:block">
            <span className="mr-2 text-xl font-black text-primary-600">“</span>
            A trusted place for curious minds and great teachers.
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-4 py-10 dark:bg-gray-900 sm:px-8 lg:w-[47%] lg:px-12 lg:py-14">
        <div className="w-full max-w-xl">
          <div className="card rounded-none border-0 p-6 shadow-none hover:shadow-none animate-fade-in md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {mode === 'login' ? 'Welcome back! 👋' : 'Create your account'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              {mode === 'login'
                ? 'Login to continue your learning journey'
                : 'Join Offline Tutor as a student or teacher'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Sign Up
            </button>
          </div>

            {mode === 'login' && (
              <>
                <div className="mb-5 space-y-2.5">
                  <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                    <span className="font-bold text-blue-500">G</span> Continue with Google
                  </button>
                  <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                    <span className="font-bold text-orange-500">M</span> Continue with Microsoft
                  </button>
                </div>
                <div className="mb-5 flex items-center gap-3 text-xs text-gray-400">
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  or
                  <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
              </>
            )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selection (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-3 rounded-xl border-2 font-semibold transition flex items-center justify-center gap-2 ${
                      role === 'student'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <HiOutlineUser className="w-5 h-5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-3 rounded-xl border-2 font-semibold transition flex items-center justify-center gap-2 ${
                      role === 'teacher'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <HiOutlineAcademicCap className="w-5 h-5" />
                    Teacher
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field py-2"
                  onChange={handleImageChange}
                />
                {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
                {profileImage && (
                  <img src={profileImage} alt="Profile preview" className="w-16 h-16 rounded-full object-cover mt-2" />
                )}
              </div>
            )}

            {/* Name (signup) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    className="input-field pl-10"
                    placeholder="Your full name"
                    {...register('name', { required: 'Name is required' })}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Password *</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  Remember me
                </label>
                <button type="button" className="font-medium text-primary-600 hover:underline dark:text-primary-400">Forgot password?</button>
              </div>
            )}

            {/* Phone (signup) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    className="input-field pl-10"
                    placeholder="+91 98765 43210"
                    {...register('phone')}
                  />
                </div>
              </div>
            )}

            {/* ========== TEACHER EXTRA FIELDS ========== */}
            {mode === 'signup' && role === 'teacher' && (
              <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  Teacher Profile Details
                </p>

                {/* Degree */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Degree / Qualification *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. M.Sc Mathematics, B.Tech CSE"
                    {...register('degree', {
                      required: role === 'teacher' ? 'Degree is required' : false,
                    })}
                  />
                  {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree.message}</p>}
                </div>

                {/* Subjects multi-select */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subjects You Teach *</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {subjectsList.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition ${
                          selectedSubjects.includes(sub)
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-400'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  {selectedSubjects.length === 0 && mode === 'signup' && role === 'teacher' && (
                    <p className="text-xs text-gray-500 mt-1">Select at least one subject</p>
                  )}
                </div>

                {/* Experience & Fee */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Experience (years)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="e.g. 5"
                      {...register('experience')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Fee / Hour (₹) *</label>
                    <div className="relative">
                      <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        className="input-field pl-10"
                        placeholder="500"
                        {...register('feePerHour', {
                          required: role === 'teacher' ? 'Fee is required' : false,
                        })}
                      />
                    </div>
                    {errors.feePerHour && (
                      <p className="text-red-500 text-xs mt-1">{errors.feePerHour.message}</p>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Availability</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Weekday evenings, Weekends"
                    {...register('availability')}
                  />
                </div>

                {/* Location cascading */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">State *</label>
                    <select
                      className="input-field"
                      {...register('state', {
                        required: role === 'teacher' ? 'State is required' : false,
                      })}
                    >
                      <option value="">Select</option>
                      {getStates().map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">District *</label>
                    <select
                      className="input-field"
                      {...register('district', {
                        required: role === 'teacher' ? 'District is required' : false,
                      })}
                      disabled={!watchState}
                    >
                      <option value="">Select</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City / Area *</label>
                    <select
                      className="input-field"
                      {...register('city', {
                        required: role === 'teacher' ? 'City is required' : false,
                      })}
                      disabled={!watchDistrict}
                    >
                      <option value="">Select</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Short Bio</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Tell students about your teaching style and strengths..."
                    {...register('bio')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Teaching Demo Video</label>
                  <input type="file" accept="video/*" onChange={handleVideoChange} className="input-field py-2" />
                  <p className="text-xs text-gray-500 mt-1">MP4 or WebM, maximum 6 MB.</p>
                  {demoVideo && <p className="text-xs text-green-600 mt-1">Video ready to upload.</p>}
                  {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || (mode === 'signup' && role === 'teacher' && selectedSubjects.length === 0)}
              className="btn-primary w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Login'
                : role === 'teacher'
                ? 'Register as Teacher'
                : 'Create Student Account'}
            </button>
          </form>

          {/* Footer switch */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to="/" className="hover:text-primary-500">
            ← Back to Home
          </Link>
        </p>
      </div>
      </section>
      </div>
    </div>
  );
};

export default Login;
