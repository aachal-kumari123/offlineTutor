/**
 * Seed script - creates demo teachers & one student
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const demoTeachers = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@demo.com',
    password: 'password123',
    role: 'teacher',
    phone: '9876543210',
    degree: 'M.Sc Mathematics',
    subjects: ['Mathematics', 'Physics'],
    experience: 8,
    feePerHour: 500,
    availability: 'Weekdays evening, Weekends',
    bio: 'Passionate mathematics teacher with 8 years of experience helping students excel in board exams and competitive tests.',
    location: { state: 'Maharashtra', district: 'Mumbai', city: 'Andheri' },
    averageRating: 4.8,
    totalReviews: 24
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@demo.com',
    password: 'password123',
    role: 'teacher',
    phone: '9876543211',
    degree: 'B.Ed, M.A English',
    subjects: ['English', 'Literature'],
    experience: 5,
    feePerHour: 400,
    availability: 'Flexible timings',
    bio: 'English language expert specializing in spoken English, grammar and literature for school & college students.',
    location: { state: 'Gujarat', district: 'Ahmedabad', city: 'Navrangpura' },
    averageRating: 4.6,
    totalReviews: 18
  },
  {
    name: 'Amit Kumar',
    email: 'amit.kumar@demo.com',
    password: 'password123',
    role: 'teacher',
    phone: '9876543212',
    degree: 'B.Tech Computer Science',
    subjects: ['Computer Science', 'Programming', 'Python'],
    experience: 6,
    feePerHour: 600,
    availability: 'Weekends & Online + Offline',
    bio: 'Software engineer turned educator. Teaching coding and computer science from class 8 to college level.',
    location: { state: 'Karnataka', district: 'Bangalore Urban', city: 'Koramangala' },
    averageRating: 4.9,
    totalReviews: 31
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@demo.com',
    password: 'password123',
    role: 'teacher',
    phone: '9876543213',
    degree: 'M.Sc Chemistry',
    subjects: ['Chemistry', 'Biology'],
    experience: 7,
    feePerHour: 450,
    availability: 'Morning & Evening batches',
    bio: 'Experienced chemistry teacher focused on conceptual clarity and practical understanding for NEET aspirants.',
    location: { state: 'Telangana', district: 'Hyderabad', city: 'Gachibowli' },
    averageRating: 4.7,
    totalReviews: 22
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@demo.com',
    password: 'password123',
    role: 'teacher',
    phone: '9876543214',
    degree: 'M.A History, B.Ed',
    subjects: ['History', 'Political Science', 'Social Studies'],
    experience: 10,
    feePerHour: 350,
    availability: 'After school hours',
    bio: 'Dedicated social science teacher with a decade of experience making history interesting and exam-oriented.',
    location: { state: 'Delhi', district: 'New Delhi', city: 'Lajpat Nagar' },
    averageRating: 4.5,
    totalReviews: 15
  },
  {
    name: 'Ananya Das',
    email: 'ananya.das@demo.com',
    password: 'password123',
    role: 'teacher',
    phone: '9876543215',
    degree: 'M.Sc Physics',
    subjects: ['Physics', 'Mathematics'],
    experience: 4,
    feePerHour: 550,
    availability: 'Evening batches',
    bio: 'Young and energetic physics teacher who simplifies complex concepts for JEE and board students.',
    location: { state: 'West Bengal', district: 'Kolkata', city: 'Salt Lake' },
    averageRating: 4.4,
    totalReviews: 12
  }
];

const demoStudent = {
  name: 'Demo Student',
  email: 'student@demo.com',
  password: 'password123',
  role: 'student',
  phone: '9999999999'
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing demo users
    await User.deleteMany({
      email: { $in: [...demoTeachers.map((t) => t.email), demoStudent.email] }
    });

    // Create teachers
    for (const t of demoTeachers) {
      await User.create(t);
      console.log(`Created teacher: ${t.name}`);
    }

    // Create student
    await User.create(demoStudent);
    console.log(`Created student: ${demoStudent.name}`);

    console.log('\n✅ Seed completed successfully!');
    console.log('Demo logins:');
    console.log('  Teacher → rahul.sharma@demo.com / password123');
    console.log('  Student → student@demo.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
