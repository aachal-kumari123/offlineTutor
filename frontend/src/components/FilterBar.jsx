import { useState, useEffect } from 'react';
import { getStates, getDistricts, getCities, subjectsList } from '../data/locations';
import { HiOutlineFilter, HiOutlineX } from 'react-icons/hi';

const FilterBar = ({ filters, setFilters, onApply }) => {
  const [local, setLocal] = useState(filters);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  useEffect(() => {
    if (local.state) {
      setDistricts(getDistricts(local.state));
    } else {
      setDistricts([]);
      setCities([]);
    }
  }, [local.state]);

  useEffect(() => {
    if (local.state && local.district) {
      setCities(getCities(local.state, local.district));
    } else {
      setCities([]);
    }
  }, [local.state, local.district]);

  const handleChange = (key, value) => {
    const updated = { ...local, [key]: value };
    if (key === 'state') {
      updated.district = '';
      updated.city = '';
    }
    if (key === 'district') {
      updated.city = '';
    }
    setLocal(updated);
  };

  const handleApply = () => {
    setFilters(local);
    onApply?.(local);
  };

  const handleReset = () => {
    const empty = { state: '', district: '', city: '', subject: '', minFee: '', maxFee: '', minExp: '' };
    setLocal(empty);
    setFilters(empty);
    onApply?.(empty);
  };

  const hasFilters = Object.values(local).some((v) => v !== '' && v !== null && v !== undefined);

  return (
    <div className="card p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <HiOutlineFilter className="w-5 h-5 text-primary-600" />
          Filters
        </h3>
        {hasFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <HiOutlineX className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* State */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">State</label>
          <select
            className="input-field"
            value={local.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
          >
            <option value="">All States</option>
            {getStates().map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">District</label>
          <select
            className="input-field"
            value={local.district || ''}
            onChange={(e) => handleChange('district', e.target.value)}
            disabled={!local.state}
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">City / Area</label>
          <select
            className="input-field"
            value={local.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            disabled={!local.district}
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Subject</label>
          <select
            className="input-field"
            value={local.subject || ''}
            onChange={(e) => handleChange('subject', e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjectsList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Fee Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Min Fee</label>
            <input
              type="number"
              placeholder="₹"
              className="input-field"
              value={local.minFee || ''}
              onChange={(e) => handleChange('minFee', e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Max Fee</label>
            <input
              type="number"
              placeholder="₹"
              className="input-field"
              value={local.maxFee || ''}
              onChange={(e) => handleChange('maxFee', e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
            Min Experience (years)
          </label>
          <input
            type="number"
            placeholder="e.g. 2"
            className="input-field"
            value={local.minExp || ''}
            onChange={(e) => handleChange('minExp', e.target.value)}
            min="0"
          />
        </div>

        <button onClick={handleApply} className="btn-primary w-full mt-2">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
