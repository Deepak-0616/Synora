import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import { api } from "../services/api";
import { Bell, LogOut, Check, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
export const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 3e4);
    return () => clearInterval(interval);
  }, [user]);
  const loadNotifications = async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data);
    } catch {
    }
  };
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {
    }
  };
  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
    }
  };
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const roleLabelMap = {
    complainant: { label: "Complainant", color: "bg-emerald-100 text-emerald-800" },
    officer: { label: "Case Officer", color: "bg-blue-100 text-blue-800" },
    bureau_admin: { label: "Bureau Admin", color: "bg-purple-100 text-purple-800" },
    system_admin: { label: "System Admin", color: "bg-rose-100 text-rose-800" },
    reviewer: { label: "Council Reviewer", color: "bg-amber-100 text-amber-800" }
  };
  const currentRole = user?.role ? roleLabelMap[user.role] : { label: "User", color: "bg-slate-100 text-slate-800" };
  return <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 synora-glass">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        {
    /* Logo and Institution Context */
  }
        <div className="flex items-center gap-6">
          <Logo size="md" />
        </div>

        {
    /* Right Navigation & User Controls */
  }
        <div className="flex items-center gap-3 md:gap-4">
          {
    /* Notifications Trigger */
  }
          <div className="relative">
            <button
    onClick={() => setShowNotifications(!showNotifications)}
    className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
    title="Notifications"
  >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-cyan-600 rounded-full ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>}
            </button>

            {
    /* Notifications Dropdown */
  }
            {showNotifications && <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">Notifications</span>
                    {unreadCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {unreadCount} new
                      </span>}
                  </div>
                  {unreadCount > 0 && <button
    onClick={handleMarkAllRead}
    className="text-xs text-cyan-700 hover:text-cyan-900 font-medium"
  >
                      Mark all as read
                    </button>}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? <div className="p-6 text-center text-sm text-slate-400">
                      No notifications yet
                    </div> : notifications.map((notif) => <div
    key={notif.id}
    className={`p-3.5 hover:bg-slate-50 transition-colors ${!notif.is_read ? "bg-cyan-50/40" : ""}`}
  >
                        <div className="flex items-start justify-between gap-2">
                          <Link
    to={notif.link || "#"}
    onClick={() => setShowNotifications(false)}
    className="flex-1 text-xs"
  >
                            <p className="font-semibold text-slate-900 mb-0.5">{notif.title}</p>
                            <p className="text-slate-600 leading-snug">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1.5 block">
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                          </Link>
                          {!notif.is_read && <button
    onClick={(e) => handleMarkAsRead(notif.id, e)}
    className="p-1 rounded text-cyan-600 hover:bg-cyan-100"
    title="Mark read"
  >
                              <Check className="w-3.5 h-3.5" />
                            </button>}
                        </div>
                      </div>)}
                </div>
              </div>}
          </div>

          {
    /* User Profile Button */
  }
          <div className="relative">
            <button
    onClick={() => setShowProfileMenu(!showProfileMenu)}
    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
  >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.full_name}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded w-fit mt-0.5 ${currentRole.color}`}>
                  {currentRole.label}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {
    /* Profile Dropdown */
  }
            {showProfileMenu && <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  {user?.bureau_name && <p className="text-[10px] text-cyan-800 font-medium mt-1 truncate">
                      {user.bureau_name}
                    </p>}
                </div>
                <div className="py-1">
                  <button
    onClick={() => {
      setShowProfileMenu(false);
      logout();
    }}
    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </header>;
};
