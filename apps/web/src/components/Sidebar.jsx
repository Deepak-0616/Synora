import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FilePlus2,
  FolderKanban,
  BarChart3,
  Users2,
  ShieldAlert,
  HelpCircle,
  Building2
} from "lucide-react";
export const Sidebar = () => {
  const { user, isComplainant, isStaff, isSystemAdmin, isReviewer } = useAuth();
  const navLinkClass = ({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${isActive ? "bg-blue-700 text-white shadow-sm shadow-blue-500/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"}`;
  return <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {
    /* COMPLAINANT NAVIGATION */
  }
        {isComplainant && <div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3">
              Complainant Portal
            </span>
            <nav className="mt-2 space-y-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink to="/submit" className={navLinkClass}>
                <FilePlus2 className="w-4 h-4 text-cyan-600" />
                Submit Complaint
              </NavLink>
              <NavLink to="/complaints" className={navLinkClass}>
                <FolderKanban className="w-4 h-4" />
                My Complaints
              </NavLink>
              <NavLink to="/help" className={navLinkClass}>
                <HelpCircle className="w-4 h-4" />
                Guidelines & FAQs
              </NavLink>
            </nav>
          </div>}

        {
    /* STAFF / ADMINISTRATIVE NAVIGATION */
  }
        {isStaff && <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {user?.role === "officer" ? "Case Officer Portal" : user?.role === "bureau_admin" ? "Bureau Operations" : "System Governance"}
              </span>
            </div>

            <nav className="mt-2 space-y-1">
              <NavLink to="/admin" end className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Overview Dashboard
              </NavLink>
              <NavLink to="/admin/complaints" className={navLinkClass}>
                <FolderKanban className="w-4 h-4" />
                Case Management
              </NavLink>
              <NavLink to="/admin/reports" className={navLinkClass}>
                <BarChart3 className="w-4 h-4" />
                Reports & Analytics
              </NavLink>

              {isSystemAdmin && <NavLink to="/admin/users" className={navLinkClass}>
                  <Users2 className="w-4 h-4" />
                  Users & Roles
                </NavLink>}

              {(isSystemAdmin || isReviewer) && <NavLink to="/admin/audit" className={navLinkClass}>
                  <ShieldAlert className="w-4 h-4" />
                  Audit Trail
                </NavLink>}

              <NavLink to="/help" className={navLinkClass}>
                <HelpCircle className="w-4 h-4" />
                Procedure Manual
              </NavLink>
            </nav>
          </div>}
      </div>

      {
    /* Bureau Info Badge */
  }
      {user?.bureau_name && <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Assigned Bureau</span>
          </div>
          <p className="text-slate-600 font-medium leading-snug">{user.bureau_name}</p>
          <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
            {user.bureau_code}
          </span>
        </div>}
    </aside>;
};
