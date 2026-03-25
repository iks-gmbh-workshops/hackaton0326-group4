import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="text-xl font-semibold text-iks-dark-blue no-underline">
          DrumDiBum
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/groups" className="text-sm text-iks-text hover:text-iks-dark-blue no-underline">
            Groups
          </Link>
          <Link to="/activities" className="text-sm text-iks-text hover:text-iks-dark-blue no-underline">
            Activities
          </Link>
          <Link to="/profile" className="text-sm text-iks-text hover:text-iks-dark-blue no-underline">
            Profile
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
