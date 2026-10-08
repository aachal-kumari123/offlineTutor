import { Link } from 'react-router-dom';
import { HiOutlineLocationMarker, HiOutlineStar, HiOutlineCurrencyRupee, HiOutlineAcademicCap } from 'react-icons/hi';

const TeacherCard = ({ teacher }) => {
  const {
    _id,
    name,
    degree,
    subjects = [],
    experience,
    feePerHour,
    location,
    averageRating = 0,
    profileImage,
    bio,
    matchScore,
    distanceKm,
  } = teacher;

  const loc = location
    ? [location.city, location.district, location.state].filter(Boolean).join(', ')
    : 'Location not set';

  return (
    <Link
      to={`/teachers/${_id}`}
      className="card group overflow-hidden flex flex-col h-full hover:-translate-y-1 transition-transform duration-300"
    >
      {/* Header / Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        {profileImage ? (
          <img src={profileImage} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
            {name?.charAt(0)?.toUpperCase() || 'T'}
          </div>
        )}
        {averageRating > 0 && (
          <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/90 px-2.5 py-1 rounded-full flex items-center gap-1 text-sm font-semibold shadow">
            <HiOutlineStar className="w-4 h-4 text-accent-500 fill-accent-500" />
            {averageRating.toFixed(1)}
          </div>
        )}
        {matchScore >= 70 && (
          <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow">
            {matchScore}% match
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
          {name}
          {teacher.identityVerified && <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">✓ Verified</span>}
        </h3>

        {degree && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <HiOutlineAcademicCap className="w-4 h-4 shrink-0" />
            {degree}
          </p>
        )}

        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
          <HiOutlineLocationMarker className="w-4 h-4 shrink-0" />
          <span className="truncate">{loc}</span>
        </div>
        {distanceKm !== undefined && (
          <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {distanceKm < 1 ? 'Less than 1 km away' : `${distanceKm.toFixed(1)} km away`}
          </p>
        )}

        {/* Subjects */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {subjects.slice(0, 3).map((sub) => (
            <span
              key={sub}
              className="text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
            >
              {sub}
            </span>
          ))}
          {subjects.length > 3 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              +{subjects.length - 3}
            </span>
          )}
        </div>

        {bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2 flex-1">{bio}</p>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold">
            <HiOutlineCurrencyRupee className="w-5 h-5" />
            <span>{feePerHour || '—'}/hr</span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {experience ? `${experience}+ yrs exp` : 'New'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default TeacherCard;
