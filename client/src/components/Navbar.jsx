import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, FolderKanban, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-background px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <FolderKanban size={20} />
          </div>
          <span>TeamTask</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link to="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <FolderKanban size={16} /> Projects
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium hidden sm:block">
          Welcome, {user.name}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
}
