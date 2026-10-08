import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineAcademicCap,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineBell,
} from 'react-icons/hi';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }
    let active = true;
    const loadNotifications = async () => {
      try {
        const { data } = await api.get('/contact/my-requests');
        if (!active) return;
        const requests = data.connections || [];
        const items = requests.slice(0, 5).map((request) => {
          if (user.role === 'student') {
            const label = request.status === 'accepted' ? 'accepted your request' : request.status === 'rejected' ? 'declined your request' : 'received your request';
            return { id: request._id, text: `${request.teacher?.name || 'Teacher'} ${label}`, date: request.updatedAt || request.createdAt };
          }
          return { id: request._id, text: `${request.student?.name || 'Student'} sent you a request`, date: request.createdAt };
        });
        setNotifications(items);
      } catch {
        if (active) setNotifications([]);
      }
    };
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600 p-2 rounded-lg group-hover:bg-primary-700 transition">
              <HiOutlineAcademicCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
              TutorConnect
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/teachers" className={linkClass}>
              Find Teachers
            </NavLink>
            {user?.role === 'teacher' && (
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
            )}
            {user?.role === 'student' && (
              <NavLink to="/dashboard" className={linkClass}>
                My Dashboard
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle dark mode"
            >
              {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Notifications">
                    <HiOutlineBell className="h-5 w-5" />
                    {notifications.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-orange-100 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700"><strong>Notifications</strong><span className="text-xs text-gray-500">{notifications.length} recent</span></div>
                      {notifications.length ? notifications.map((notification) => <Link key={notification.id} to="/dashboard" onClick={() => setNotificationsOpen(false)} className="block border-b border-gray-100 py-3 text-sm last:border-0 dark:border-gray-700"><span>{notification.text}</span><span className="mt-1 block text-xs text-gray-400">{new Date(notification.date).toLocaleDateString()}</span></Link>) : <p className="py-4 text-sm text-gray-500">No new notifications</p>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <HiOutlineUser className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 capitalize">
                    {user.role}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn-secondary flex items-center gap-1.5 text-sm py-2">
                  <HiOutlineLogout className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2">
                  Login
                </Link>
                <Link to="/login?mode=signup" className="btn-primary text-sm py-2">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1 animate-fade-in">
          <NavLink to="/" className={linkClass} end onClick={() => setMobileOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/teachers" className={linkClass} onClick={() => setMobileOpen(false)}>
            Find Teachers
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass} onClick={() => setMobileOpen(false)}>
              Dashboard
            </NavLink>
          )}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {user ? (
              <>
                <p className="px-3 text-sm text-gray-600 dark:text-gray-400">
                  Signed in as <strong>{user.name}</strong> ({user.role})
                </p>
                <button onClick={handleLogout} className="w-full btn-secondary text-left flex items-center gap-2">
                  <HiOutlineLogout className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block btn-secondary text-center" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="block btn-primary text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
