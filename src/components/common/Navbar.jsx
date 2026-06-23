import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-12 flex items-center justify-center">
            <img 
              src="/DxEHk.jpg"           // Put your logo in public folder
              alt="LandVault Logo" 
              className="h-12 w-auto rounded-md"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">LandVault</h1>
            <p className="text-[10px] text-teal-500 -mt-1">Secure Land Registry for Swazi Owned land</p>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-800 px-4 py-2 rounded-2xl">
            <div className="w-8 h-8 bg-zinc-700 rounded-xl flex items-center justify-center">
              <User size={18} />
            </div>
            <div className="text-sm">
              <p className="font-medium text-white">{user.email || 'User'}</p>
              <p className="text-teal-500 text-xs capitalize">{user.role || 'owner'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-2xl transition"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;