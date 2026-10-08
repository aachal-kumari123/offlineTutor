const express = require('express');
const User = require('../models/User');
const Connection = require('../models/Connection');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      state,
      district,
      city,
      subject,
      minFee,
      maxFee,
      minExperience,
      search,
      page = 1,
      limit = 12,
      sort = '-averageRating'
    } = req.query;

    // Base filter
    const filter = {
      role: 'teacher',
      isApproved: true
    };

    // Location filters
    if (state) filter['location.state'] = new RegExp(state, 'i');
    if (district) filter['location.district'] = new RegExp(district, 'i');
    if (city) filter['location.city'] = new RegExp(city, 'i');

    // Subject filter
    if (subject) {
      filter.subjects = { $in: [new RegExp(subject, 'i')] };
    }

    // Fee range
    if (minFee || maxFee) {
      filter.feePerHour = {};
      if (minFee) filter.feePerHour.$gte = Number(minFee);
      if (maxFee) filter.feePerHour.$lte = Number(maxFee);
    }

    // Experience
    if (minExperience) {
      filter.experience = { $gte: Number(minExperience) };
    }

    // Search by name or subjects
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { subjects: { $in: [new RegExp(search, 'i')] } },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOption = {};
    if (sort === 'fee-low') sortOption = { feePerHour: 1 };
    else if (sort === 'fee-high') sortOption = { feePerHour: -1 };
    else if (sort === 'experience') sortOption = { experience: -1 };
    else if (sort === 'rating') sortOption = { averageRating: -1 };
    else sortOption = { averageRating: -1, createdAt: -1 };

    const [teachers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: teachers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      teachers
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/teachers/featured
// @desc    Get featured / top rated teachers
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const teachers = await User.find({
      role: 'teacher',
      isApproved: true
    })
      .select('-password')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(6);

    res.json({
      success: true,
      teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get single teacher by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher'
    })
      .select('-password')
      .populate('ratings.user', 'name');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/teachers/:id/rate
// @desc    Add rating & review to teacher
// @access  Private (Student)
router.post('/:id/rate', protect, restrictTo('student'), async (req, res) => {
  try {
    const { rating, review, videoReview } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher'
    });

    const completedClass = await Connection.findOne({
      teacher: teacher._id,
      student: req.user.id,
      status: 'accepted',
      progressStatus: { $in: ['demo_done', 'classes_started'] }
    });
    if (!completedClass) {
      return res.status(403).json({ success: false, message: 'Reviews are available after your demo or classes.' });
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if already rated
    const alreadyRated = teacher.ratings.find(
      (r) => r.user.toString() === req.user.id
    );

    if (alreadyRated) {
      // Update existing rating
      alreadyRated.rating = rating;
      alreadyRated.review = review || alreadyRated.review;
      alreadyRated.videoReview = videoReview || alreadyRated.videoReview;
    } else {
      teacher.ratings.push({
        user: req.user.id,
        rating,
        review
        ,videoReview
      });
    }

    teacher.calculateAverageRating();
    await teacher.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      averageRating: teacher.averageRating,
      totalReviews: teacher.totalReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/teachers/stats/overview
// @desc    Get platform stats
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalTeachers, totalStudents, subjectsAgg] = await Promise.all([
      User.countDocuments({ role: 'teacher', isApproved: true }),
      User.countDocuments({ role: 'student' }),
      User.aggregate([
        { $match: { role: 'teacher', isApproved: true } },
        { $unwind: '$subjects' },
        { $group: { _id: '$subjects' } },
        { $count: 'total' }
      ])
    ]);

    const uniqueSubjects = subjectsAgg[0]?.total || 0;

    // Get unique cities
    const cities = await User.distinct('location.city', {
      role: 'teacher',
      isApproved: true,
      'location.city': { $ne: null, $ne: '' }
    });

    res.json({
      success: true,
      stats: {
        totalTeachers,
        totalStudents,
        uniqueSubjects,
        citiesCovered: cities.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
