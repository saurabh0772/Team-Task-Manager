const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard statistics for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get all projects where the user is a member or admin
    const projects = await Project.find({ members: userId });
    const projectIds = projects.map(p => p._id);

    // 1. Total tasks count
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });

    // 2. Tasks grouped by status
    const tasksByStatus = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format tasksByStatus for frontend
    const formattedStatus = {
      'To Do': 0,
      'In Progress': 0,
      'Done': 0
    };
    tasksByStatus.forEach(stat => {
      if (formattedStatus[stat._id] !== undefined) {
        formattedStatus[stat._id] = stat.count;
      }
    });

    // 3. Tasks per user
    const tasksPerUserRaw = await Task.aggregate([
      { $match: { project: { $in: projectIds }, assignedTo: { $exists: true, $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', count: 1, _id: 0 } }
    ]);

    // 4. Overdue tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: today },
      status: { $ne: 'Done' }
    }).populate('project', 'title').populate('assignedTo', 'name');

    res.json({
      totalTasks,
      tasksByStatus: formattedStatus,
      tasksPerUser: tasksPerUserRaw,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
