import { useState } from 'react';
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
} from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

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
