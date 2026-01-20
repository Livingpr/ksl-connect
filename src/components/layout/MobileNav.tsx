import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Camera, History, BarChart3, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Camera, label: "Camera", path: "/camera" },
  { icon: BarChart3, label: "Stats", path: "/stats" },
  { icon: History, label: "History", path: "/history" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-muted"
              }`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
