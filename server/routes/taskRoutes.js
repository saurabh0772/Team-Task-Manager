const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Helper middleware to check if user is admin of the project a task belongs to
const checkTaskAdmin = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.project.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized, admin only' });
    }
    req.task = task;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @route   POST /api/tasks
// @desc    Create task (Admin only)
// @access  Private
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, assignedTo } = req.body;
    const projectId = req.body.project || req.project._id;

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      status,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user.id
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/tasks/project/:id
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure user is member or admin
    if (!project.members.includes(req.user.id) && project.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task (status, assignee, etc.)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAdmin = task.project.admin.toString() === req.user.id;
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id;

    // Member can only update status if they are assigned to the task
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // If not admin, restrict what they can update (only status)
    const updateData = { ...req.body };
    if (!isAdmin) {
      delete updateData.title;
      delete updateData.description;
      delete updateData.dueDate;
      delete updateData.priority;
      delete updateData.assignedTo;
      delete updateData.project;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task (Admin only)
// @access  Private
router.delete('/:id', protect, checkTaskAdmin, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
