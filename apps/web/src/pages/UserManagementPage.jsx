import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Modal } from "../components/Modal";
import {
  Users2,
  Search,
  UserCheck,
  UserX,
  History
} from "lucide-react";
export const UserManagementPage = () => {
  const { user: currentUser, isSystemAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [bureaus, setBureaus] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("complainant");
  const [newBureauId, setNewBureauId] = useState("");
  const [newIsActive, setNewIsActive] = useState(1);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, bureauRes, auditRes] = await Promise.all([
        api.get("/users"),
        api.get("/bureaus"),
        api.get("/users/audit-logs")
      ]);
      setUsers(userRes || []);
      setBureaus(bureauRes || []);
      setAuditLogs(auditRes || []);
    } catch (err) {
      console.error("Failed to load user management data:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleEditClick = (u) => {
    setEditingUser(u);
    setNewRole(u.role);
    setNewBureauId(u.bureau_id || "");
    setNewIsActive(u.is_active ? 1 : 0);
    setModalError(null);
  };
  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    setModalError(null);
    try {
      await api.patch(`/users/${editingUser.id}/role`, {
        role: newRole,
        bureau_id: newBureauId || null,
        is_active: newIsActive
      });
      setEditingUser(null);
      loadData();
    } catch (err) {
      setModalError(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };
  const filteredUsers = users.filter(
    (u) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  if (loading) {
    return <LoadingSpinner message="Loading user directory & audit security records..." size="lg" />;
  }
  return <div className="space-y-6">
      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Directory & Governance Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-based privilege allocation, bureau membership, and security audit log inspection
          </p>
        </div>

        {
    /* Tab switch */
  }
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
          <button
    onClick={() => setActiveTab("users")}
    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "users" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
  >
            <Users2 className="w-3.5 h-3.5" /> Users ({users.length})
          </button>
          <button
    onClick={() => setActiveTab("audit")}
    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "audit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
  >
            <History className="w-3.5 h-3.5 text-blue-600" /> Security Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === "users" && <div className="synora-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search name or email..."
    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600"
  />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredUsers.length} verified accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">User Identity</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Bureau / Cell</th>
                  <th className="px-5 py-3.5">Affiliation</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${u.role === "system_admin" ? "bg-rose-100 text-rose-800" : u.role === "bureau_admin" ? "bg-purple-100 text-purple-800" : u.role === "officer" ? "bg-blue-100 text-blue-800" : u.role === "reviewer" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                        {u.role.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {u.bureau_name ? <span className="font-semibold text-cyan-800">
                          {u.bureau_name} ({u.bureau_code})
                        </span> : <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {u.designation || "Standard User"}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.is_active ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <UserCheck className="w-3 h-3" /> Active
                        </span> : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <UserX className="w-3 h-3" /> Deactivated
                        </span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isSystemAdmin && <button
    onClick={() => handleEditClick(u)}
    className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
  >
                          Modify Role
                        </button>}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}

      {
    /* AUDIT LOG TAB */
  }
      {activeTab === "audit" && <div className="synora-card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Cryptographic Security & Operational Audit Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit trail recording every state transition, assignment, and privilege change
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor Identity</th>
                  <th className="px-5 py-3">Security Action</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">Audit Details / Payload</th>
                  <th className="px-5 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{log.actor_name || "System Service"}</span>
                      {log.actor_role && <span className="text-[10px] text-slate-400 block">
                          {log.actor_role}
                        </span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                      {log.entity_type} ({log.entity_id.slice(0, 8)}...)
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                      {log.new_values || log.old_values || "\u2014"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}

      {
    /* EDIT USER ROLE MODAL */
  }
      <Modal
    isOpen={!!editingUser}
    onClose={() => setEditingUser(null)}
    title={`Edit Role: ${editingUser?.full_name}`}
  >
        <div className="space-y-4 text-xs">
          {modalError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
            <select
    value={newRole}
    onChange={(e) => setNewRole(e.target.value)}
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
  >
              <option value="complainant">Complainant (Public User)</option>
              <option value="officer">Case Officer (Investigator)</option>
              <option value="bureau_admin">Bureau Administrator</option>
              <option value="system_admin">System Administrator</option>
              <option value="reviewer">Council Reviewer (Read-Only Oversight)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Bureau / Cell</label>
            <select
    value={newBureauId}
    onChange={(e) => setNewBureauId(e.target.value)}
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  >
              <option value="">No Specific Bureau (Unassigned / System Wide)</option>
              {bureaus.map((b) => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Account State</label>
            <select
    value={newIsActive}
    onChange={(e) => setNewIsActive(parseInt(e.target.value, 10))}
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
  >
              <option value={1}>Active</option>
              <option value={0}>Deactivated (Revoke Login)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
    onClick={() => setEditingUser(null)}
    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
  >
              Cancel
            </button>
            <button
    onClick={handleSaveUser}
    disabled={saving}
    className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold disabled:opacity-50"
  >
              {saving ? "Saving..." : "Apply Role Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>;
};
