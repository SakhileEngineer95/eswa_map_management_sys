import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  LandPlot,
  Settings,
  CircleUser, 
  List, 
  History, 
  Users, 
  Shield, 
  BarChart3 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'admin';

  const menuItems = {
    registrar: [
      { icon: Home, label: "Dashboard", path: "/registrardashboard" },
      { icon: LandPlot, label: "Land Management", path: "/landmanagementmenu" },
      { icon: Settings, label: "Settings", path: "/settings" }
    ],
    admin: [
      { icon: Home, label: "Dashboard", path: "/admindashboard" },
      { icon: CircleUser, label: "Account Management", path: "/accountmanagementmenu" },
      { icon: LandPlot, label: "Land Management", path: "/landmanagementmenu" },
      { icon: Users, label: "Land Owners Management", path: "/landownermanagementmenu" },
      { icon: BarChart3, label: "Reports", path: "/reports" },
    ]
  };

  const currentMenu = menuItems[role] || menuItems.owner;

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen fixed left-0 top-16 pt-8">
      <div className="px-6 mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-2">MAIN MENU</p>
      </div>

      <div className="px-3 space-y-1">
        {currentMenu.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-teal-600 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-8 px-6 w-full">
        <div className="bg-zinc-800 rounded-2xl p-4 text-xs">
          <p className="text-teal-500 font-medium">Need Help?</p>
          <p className="text-zinc-500 mt-1">Contact System Administrator</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;