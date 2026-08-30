// Sample Indian states, districts & cities for cascading filters
// Expand as needed

export const locations = {
  Maharashtra: {
    districts: {
      Pune: ['Pune', 'Pimpri-Chinchwad', 'Hinjewadi', 'Wakad', 'Baner', 'Kothrud'],
      Mumbai: ['Andheri', 'Bandra', 'Dadar', 'Powai', 'Thane', 'Navi Mumbai'],
      Nagpur: ['Nagpur City', 'Kamptee', 'Katol'],
    },
  },
  Karnataka: {
    districts: {
      Bangalore: ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'Jayanagar', 'Malleshwaram'],
      Mysore: ['Mysore City', 'Nanjangud'],
      Mangalore: ['Mangalore City', 'Udupi'],
    },
  },
  Delhi: {
    districts: {
      'New Delhi': ['Connaught Place', 'Karol Bagh', 'Saket', 'Dwarka', 'Rohini', 'Lajpat Nagar'],
      'South Delhi': ['Hauz Khas', 'Greater Kailash', 'Vasant Kunj'],
      'East Delhi': ['Laxmi Nagar', 'Mayur Vihar', 'Preet Vihar'],
    },
  },
  'Uttar Pradesh': {
    districts: {
      Lucknow: ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar'],
      Noida: ['Sector 18', 'Sector 62', 'Greater Noida'],
      Varanasi: ['Varanasi City', 'Lanka'],
    },
  },
  'Tamil Nadu': {
    districts: {
      Chennai: ['T Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR'],
      Coimbatore: ['RS Puram', 'Peelamedu', 'Saibaba Colony'],
      Madurai: ['Madurai City'],
    },
  },
  Gujarat: {
    districts: {
      Ahmedabad: ['Navrangpura', 'Satellite', 'Bopal', 'SG Highway'],
      Surat: ['Adajan', 'Vesu', 'City Light'],
      Vadodara: ['Alkapuri', 'Fatehgunj'],
    },
  },
  Rajasthan: {
    districts: {
      Jaipur: ['Malviya Nagar', 'C Scheme', 'Vaishali Nagar', 'Mansarovar'],
      Udaipur: ['Udaipur City'],
      Jodhpur: ['Jodhpur City'],
    },
  },
  'West Bengal': {
    districts: {
      Kolkata: ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge', 'Howrah'],
    },
  },
  Telangana: {
    districts: {
      Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Hitech City', 'Secunderabad'],
    },
  },
  Punjab: {
    districts: {
      Chandigarh: ['Sector 17', 'Sector 22', 'Mohali'],
      Ludhiana: ['Ludhiana City'],
    },
  },
};

export const subjectsList = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Computer Science',
  'Accountancy',
  'Economics',
  'Business Studies',
  'History',
  'Geography',
  'Political Science',
  'Sanskrit',
  'French',
  'German',
  'Coding / Programming',
  'Competitive Exams (JEE/NEET)',
  'Spoken English',
  'Music',
];

export const getStates = () => Object.keys(locations);

export const getDistricts = (state) => {
  if (!state || !locations[state]) return [];
  return Object.keys(locations[state].districts);
};

export const getCities = (state, district) => {
  if (!state || !district || !locations[state]?.districts[district]) return [];
  return locations[state].districts[district];
};
