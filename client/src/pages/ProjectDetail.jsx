import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { Calendar, UserPlus, Trash2, Plus, GripVertical, UserCircle } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [memberEmail, setMemberEmail] = useState('');
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // null = create, object = edit
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: ''
  });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch project data', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = project?.admin._id === user._id;

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleOpenTaskModal = (task = null) => {
    if (task) {
      setCurrentTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo?._id || ''
      });
    } else {
      setCurrentTask(null);
      setTaskForm({
        title: '', description: '', dueDate: '', priority: 'Medium', status: 'To Do', assignedTo: ''
      });
    }
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (currentTask) {
        // Update
        const payload = { ...taskForm };
        if (!isAdmin) {
          // If not admin, only status can be updated (handled by backend but good to enforce here)
          await api.put(`/tasks/${currentTask._id}`, { status: payload.status });
        } else {
          await api.put(`/tasks/${currentTask._id}`, payload);
        }
      } else {
        // Create
        await api.post('/tasks', { ...taskForm, project: id });
      }
      setTaskModalOpen(false);
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  // Status Change directly from board
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProjectData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update task');
    }
  };

  if (loading) return <div>Loading project...</div>;
  if (!project) return <div>Project not found</div>;

  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenTaskModal()}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kanban Board */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(status => (
            <div key={status} className="bg-muted/50 rounded-lg p-4 flex flex-col h-full min-h-[500px]">
              <h3 className="font-semibold mb-4 flex justify-between items-center text-sm uppercase text-muted-foreground tracking-wider">
                {status}
                <Badge variant="secondary">{tasks.filter(t => t.status === status).length}</Badge>
              </h3>
              
              <div className="space-y-3 flex-1">
                {tasks.filter(t => t.status === status).map(task => {
                  const isAssignee = task.assignedTo?._id === user._id;
                  const canEdit = isAdmin || isAssignee;

                  return (
                    <Card key={task._id} className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm" onClick={() => handleOpenTaskModal(task)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium line-clamp-2 text-sm leading-tight">{task.title}</h4>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <div className="text-[10px] flex items-center text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-2 border-t pt-2" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={task.assignedTo?.name || 'Unassigned'}>
                            <UserCircle className="h-4 w-4" />
                            <span className="truncate max-w-[80px]">{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                          
                          {canEdit && (
                            <Select 
                              value={task.status} 
                              onChange={(e) => handleStatusChange(task._id, e.target.value)}
                              className="h-7 text-xs py-0 w-[110px]"
                            >
                              {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar - Members */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                  <Input 
                    placeholder="User email..." 
                    value={memberEmail} 
                    onChange={e => setMemberEmail(e.target.value)}
                    required
                    type="email"
                    className="h-9 text-sm"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3">Add</Button>
                </form>
              )}

              <div className="space-y-3">
                {project.members.map(member => (
                  <div key={member._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    {isAdmin && member._id !== project.admin._id && (
                      <button 
                        onClick={() => handleRemoveMember(member._id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {member._id === project.admin._id && (
                      <Badge variant="outline" className="text-[10px]">Admin</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Modal */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveTask}>
            <DialogHeader>
              <DialogTitle>{currentTask ? 'Task Details' : 'Create Task'}</DialogTitle>
              <DialogDescription>
                {currentTask && !isAdmin && currentTask.assignedTo?._id !== user._id 
                  ? "You can view this task's details."
                  : currentTask && !isAdmin 
                    ? "You can only update the status of this task."
                    : "Fill out the task details below."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Title</Label>
                <Input 
                  id="task-title" 
                  value={taskForm.title} 
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                  required 
                  disabled={!isAdmin && !!currentTask}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-desc">Description</Label>
                <Input 
                  id="task-desc" 
                  value={taskForm.description} 
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})} 
                  disabled={!isAdmin && !!currentTask}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input 
                    id="task-due" 
                    type="date" 
                    value={taskForm.dueDate} 
                    onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} 
                    disabled={!isAdmin && !!currentTask}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select 
                    id="task-priority" 
                    value={taskForm.priority} 
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                    disabled={!isAdmin && !!currentTask}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select 
                    id="task-status" 
                    value={taskForm.status} 
                    onChange={e => setTaskForm({...taskForm, status: e.target.value})}
                    disabled={!!currentTask && !isAdmin && currentTask.assignedTo?._id !== user._id}
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Select 
                    id="task-assignee" 
                    value={taskForm.assignedTo} 
                    onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}
                    disabled={!isAdmin && !!currentTask}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
              {(!currentTask || isAdmin || currentTask.assignedTo?._id === user._id) && (
                <Button type="submit">Save changes</Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
