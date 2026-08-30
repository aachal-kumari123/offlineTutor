import { Link } from 'react-router-dom';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <HiOutlineAcademicCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TutorConnect</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connect with experienced offline tutors near you. Quality education, personal attention, better results.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full bg-gray-800 hover:bg-primary-600 transition">
                <FaFacebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-gray-800 hover:bg-primary-600 transition">
                <FaTwitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-gray-800 hover:bg-primary-600 transition">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-gray-800 hover:bg-primary-600 transition">
                <FaLinkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/teachers" className="hover:text-primary-400 transition">
                  Find Teachers
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-400 transition">
                  Login / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* For Teachers */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Teachers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login?mode=signup" className="hover:text-primary-400 transition">
                  Register as Teacher
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition">
                  Pricing Tips
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: support@tutorconnect.com</li>
              <li>Phone: +91 98765 43210</li>
              <li>Mon – Sat: 9 AM – 7 PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} TutorConnect. All rights reserved. Built for offline learning.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
