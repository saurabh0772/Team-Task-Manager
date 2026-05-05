const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

const router = express.Router();

// @route   POST /api/projects
// @desc    Create project (creator = Admin)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Please provide a title' });
    }

    const project = await Project.create({
      title,
      description,
      admin: req.user.id,
      members: [req.user.id] // Admin is also a member
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/projects
// @desc    Get all projects for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find projects where user is either admin or a member
    const projects = await Project.find({
      members: req.user.id
    }).populate('admin', 'name email').sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project with members & tasks
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure the user is part of the project
    if (!project.members.some(m => m._id.toString() === req.user.id) && project.admin._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({ project, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Admin: Add member by email
// @access  Private (Admin only)
router.post('/:id/members', protect, adminOnly, async (req, res) => {
  try {
    const { email } = req.body;

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const project = req.project; // Provided by adminOnly middleware

    // Check if user is already a member
    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push(userToAdd._id);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Admin: Remove member
// @access  Private (Admin only)
router.delete('/:id/members/:userId', protect, adminOnly, async (req, res) => {
  try {
    const project = req.project;
    const userIdToRemove = req.params.userId;

    if (project.admin.toString() === userIdToRemove) {
      return res.status(400).json({ message: 'Cannot remove the admin from the project' });
    }

    project.members = project.members.filter(member => member.toString() !== userIdToRemove);
    await project.save();

    // Optionally: Unassign tasks assigned to this user in this project
    await Task.updateMany(
      { project: project._id, assignedTo: userIdToRemove },
      { $unset: { assignedTo: 1 } }
    );

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
