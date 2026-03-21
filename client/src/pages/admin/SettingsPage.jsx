import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { getUsers, updateUser } from "../../api/userApi";
import { formatDate } from "../../utils/formatters";

const ROLES = ["learner", "instructor", "admin"];
const ROLE_BADGE = {
  admin: "badge-danger",
  instructor: "badge-info",
  learner: "badge-success",
};

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "learner" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({ name: u.name, role: u.role });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUser(editTarget.id, editForm);
      setUsers((prev) =>
        prev.map((u) => (u.id === editTarget.id ? { ...u, ...res.data } : u)),
      );
      toast.success("User updated");
      setEditTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <Navbar variant="admin" />
      <div className="o-control-panel">
        <span className="o-control-panel-title">User Management</span>
        <input
          className="o-input"
          style={{ width: 240 }}
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="o-main-view">
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--o-border)",
            borderRadius: "var(--o-radius-lg)",
            overflow: "hidden",
          }}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 44, margin: "2px 0" }}
              />
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">
                <i className="fas fa-users" />
              </div>
              <div className="empty-state-title">No users found</div>
            </div>
          ) : (
            <table className="o-list-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Points</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: "var(--o-text-secondary)" }}>
                      {u.email}
                    </td>
                    <td>
                      <span
                        className={`badge ${ROLE_BADGE[u.role] || "badge-muted"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.total_points || 0}</td>
                    <td
                      style={{
                        color: "var(--o-text-secondary)",
                        fontSize: "0.857rem",
                      }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => openEdit(u)}
                        title="Edit">
                        <i className="fas fa-pencil" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editTarget && (
        <Modal
          title={`Edit User — ${editTarget.name}`}
          onClose={() => setEditTarget(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setEditTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}>
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </>
          }>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="o-input"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            {editTarget.id === currentUser?.id ? (
              <p
                style={{
                  color: "var(--o-text-secondary)",
                  fontSize: "0.929rem",
                }}>
                You cannot change your own role.
              </p>
            ) : editTarget.role === "admin" ? (
              <p
                style={{
                  color: "var(--o-text-secondary)",
                  fontSize: "0.929rem",
                }}>
                Cannot change role of another admin.
              </p>
            ) : (
              <select
                className="o-select"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }>
                {ROLES.filter((r) => r !== "admin").map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
