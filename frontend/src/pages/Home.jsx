import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import TeacherCard from '../components/TeacherCard';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineChatAlt2,
  HiOutlineBookOpen,
} from 'react-icons/hi';

// Demo featured teachers (will be replaced by API later)
const featuredTeachers = [
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
];

const stats = [
  { icon: HiOutlineUserGroup, value: '2,500+', label: 'Verified Teachers' },
  { icon: HiOutlineLocationMarker, value: '120+', label: 'Cities Covered' },
  { icon: HiOutlineBookOpen, value: '40+', label: 'Subjects Offered' },
  { icon: HiOutlineAcademicCap, value: '15,000+', label: 'Happy Students' },
];

const steps = [
  {
    icon: HiOutlineSearch,
    title: 'Search & Filter',
    desc: 'Find teachers by location, subject, fee and experience that match your needs.',
  },
  {
    icon: HiOutlineChatAlt2,
    title: 'Connect Instantly',
    desc: 'Send a message. The teacher receives an email notification and can respond quickly.',
  },
  {
    icon: HiOutlineCheckCircle,
    title: 'Start Learning',
    desc: 'Meet offline at a convenient place and begin your personalized tuition journey.',
  },
];

const Home = () => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="pt-6">
        <HeroSlider />
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="card p-6 text-center hover:scale-105 transition-transform duration-300"
            >
              <stat.icon className="w-10 h-10 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary-50 dark:bg-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
              How TutorConnect Works
            </h2>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Three simple steps to find the perfect offline tutor for you or your child.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg mb-5">
                  <step.icon className="w-8 h-8" />
                </div>
                <span className="absolute top-0 right-1/4 md:right-auto md:left-1/2 md:translate-x-8 text-5xl font-black text-primary-200 dark:text-primary-900/40 -z-10">
                  {i + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Featured Teachers</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Top-rated tutors ready to help you succeed.
            </p>
          </div>
          <Link to="/teachers" className="btn-primary self-start sm:self-auto">
            View All Teachers
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTeachers.map((t) => (
            <TeacherCard key={t._id} teacher={t} />
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-indigo-600 p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Are you a teacher?</h2>
            <p className="text-lg text-white/90 mb-6">
              Join thousands of tutors on TutorConnect. Create your profile, set your fees, and start receiving student requests today.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login?mode=signup"
                className="bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition shadow-lg"
              >
                Register as Teacher
              </Link>
              <Link
                to="/teachers"
                className="border-2 border-white/60 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition"
              >
                Browse as Student
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10">
          Why Choose TutorConnect?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: HiOutlineLocationMarker,
              title: 'Local Offline Tutors',
              desc: 'Find teachers in your city and area for convenient in-person classes.',
            },
            {
              icon: HiOutlineClock,
              title: 'Flexible Scheduling',
              desc: 'Match with tutors who offer timings that work for your routine.',
            },
            {
              icon: HiOutlineCheckCircle,
              title: 'Verified Profiles',
              desc: 'Teachers list qualifications, experience, subjects and fees transparently.',
            },
          ].map((item, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
