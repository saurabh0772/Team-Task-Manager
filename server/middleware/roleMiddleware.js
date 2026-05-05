const Project = require('../models/Project');

const adminOnly = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required to verify admin role' });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized, admin only' });
    }

    // Attach project to req to save a DB call in the controller
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { adminOnly };
