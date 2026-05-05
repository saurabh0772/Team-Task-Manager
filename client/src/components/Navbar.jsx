import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-background sticky top-0 z-10">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <FolderKanban size={20} />
            </div>
            <span className="hidden sm:inline">TeamTask</span>
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
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-sm font-medium hidden sm:block">
            Welcome, {user.name}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
          
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t px-6 py-4 flex flex-col gap-4 bg-background">
          <div className="text-sm font-medium sm:hidden text-muted-foreground mb-2">
            Welcome, {user.name}
          </div>
          <Link to="/dashboard" className="text-sm font-medium flex items-center gap-2 p-2 hover:bg-accent rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link to="/projects" className="text-sm font-medium flex items-center gap-2 p-2 hover:bg-accent rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
            <FolderKanban size={16} /> Projects
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start px-2 mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 sm:hidden">
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
}
