import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import { useToast } from "../../hooks/useToast";
import { useDebounce } from "../../hooks/useDebounce";
import { getReport } from "../../api/reportApi";
import { formatDate, formatDuration } from "../../utils/formatters";

const ALL_COLUMNS = [
  { key: "sr", label: "Sr No" },
  { key: "course_name", label: "Course" },
  { key: "participant_name", label: "Participant" },
  { key: "enrolled_at", label: "Enrolled" },
  { key: "started_at", label: "Started" },
  { key: "time_spent_seconds", label: "Time Spent" },
  { key: "completion_percent", label: "Completion %" },
  { key: "completed_at", label: "Completed" },
  { key: "status", label: "Status" },
];

function StatusBadge({ status }) {
  const map = {
    yet_to_start: ["muted", "Yet to Start"],
    in_progress: ["info", "In Progress"],
    completed: ["success", "Completed"],
  };
  const [type, label] = map[status] || ["muted", status];
  return <span className={`badge badge-${type}`}>{label}</span>;
}

export default function ReportingPage() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [visibleCols, setVisibleCols] = useState(ALL_COLUMNS.map((c) => c.key));
  const [showColPanel, setShowColPanel] = useState(false);
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReport({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: LIMIT,
      });
      setData(res.data.data);
      setTotal(res.data.total);
      setStats(res.data.stats || {});
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey],
      bv = b[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const statCards = [
    {
      key: "",
      label: "Total",
      value: stats.total,
      icon: "fa-users",
      color: "var(--o-primary)",
    },
    {
      key: "yet_to_start",
      label: "Yet to Start",
      value: stats.yet_to_start,
      icon: "fa-clock",
      color: "var(--o-gray-600)",
    },
    {
      key: "in_progress",
      label: "In Progress",
      value: stats.in_progress,
      icon: "fa-spinner",
      color: "var(--o-info)",
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completed,
      icon: "fa-check-circle",
      color: "var(--o-success)",
    },
  ];

  return (
    <div>
      <Navbar variant="admin" />
      <div className="o-control-panel">
        <span className="o-control-panel-title">Reporting</span>
        <input
          className="o-input"
          style={{ width: 240 }}
          placeholder="Search by name or course..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowColPanel(!showColPanel)}>
          <i className="fas fa-columns" /> Columns
        </button>
      </div>

      <div className="o-main-view">
        {/* Stat cards */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}>
          {statCards.map((s) => (
            <div
              key={s.label}
              onClick={() => {
                setStatusFilter(s.key);
                setPage(1);
              }}
              style={{
                flex: 1,
                minWidth: 140,
                background: "#fff",
                border: `2px solid ${statusFilter === s.key ? s.color : "var(--o-border)"}`,
                borderRadius: "var(--o-radius-lg)",
                padding: "16px 20px",
                cursor: "pointer",
                transition: "border-color var(--o-transition)",
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}>
                <i className={`fas ${s.icon}`} style={{ color: s.color }} />
                <span
                  style={{
                    fontSize: "0.857rem",
                    color: "var(--o-text-secondary)",
                  }}>
                  {s.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.714rem",
                  fontWeight: 700,
                  color: s.color,
                }}>
                {s.value || 0}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              background: "#fff",
              border: "1px solid var(--o-border)",
              borderRadius: "var(--o-radius)",
              overflow: "hidden",
            }}>
            {loading ? (
              <div style={{ padding: 24 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 40, marginBottom: 4 }}
                  />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-chart-bar" />
                </div>
                <div className="empty-state-title">No data found</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="o-list-table">
                  <thead>
                    <tr>
                      {ALL_COLUMNS.filter((c) =>
                        visibleCols.includes(c.key),
                      ).map((c) => (
                        <th
                          key={c.key}
                          onClick={() => handleSort(c.key)}
                          style={{ cursor: "pointer", userSelect: "none" }}>
                          {c.label}{" "}
                          {sortKey === c.key && (
                            <i
                              className={`fas fa-sort-${sortDir === "asc" ? "up" : "down"}`}
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => (
                      <tr key={row.id}>
                        {visibleCols.includes("sr") && (
                          <td>{(page - 1) * LIMIT + i + 1}</td>
                        )}
                        {visibleCols.includes("course_name") && (
                          <td style={{ fontWeight: 500 }}>{row.course_name}</td>
                        )}
                        {visibleCols.includes("participant_name") && (
                          <td>{row.participant_name}</td>
                        )}
                        {visibleCols.includes("enrolled_at") && (
                          <td>{formatDate(row.enrolled_at)}</td>
                        )}
                        {visibleCols.includes("started_at") && (
                          <td>{formatDate(row.started_at)}</td>
                        )}
                        {visibleCols.includes("time_spent_seconds") && (
                          <td>{formatDuration(row.time_spent_seconds)}</td>
                        )}
                        {visibleCols.includes("completion_percent") && (
                          <td>{row.completion_percent || 0}%</td>
                        )}
                        {visibleCols.includes("completed_at") && (
                          <td>{formatDate(row.completed_at)}</td>
                        )}
                        {visibleCols.includes("status") && (
                          <td>
                            <StatusBadge status={row.status} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {total > LIMIT && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderTop: "1px solid var(--o-border)",
                }}>
                <span
                  style={{
                    fontSize: "0.857rem",
                    color: "var(--o-text-secondary)",
                  }}>
                  Showing {(page - 1) * LIMIT + 1}–
                  {Math.min(page * LIMIT, total)} of {total}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}>
                    ‹ Prev
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page * LIMIT >= total}
                    onClick={() => setPage(page + 1)}>
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Column customizer */}
          {showColPanel && (
            <div
              style={{
                width: 200,
                background: "#fff",
                border: "1px solid var(--o-border)",
                borderRadius: "var(--o-radius)",
                padding: 16,
                flexShrink: 0,
                height: "fit-content",
              }}>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>Columns</div>
              {ALL_COLUMNS.map((c) => (
                <label
                  key={c.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    cursor: "pointer",
                    fontSize: "0.929rem",
                  }}>
                  <input
                    type="checkbox"
                    checked={visibleCols.includes(c.key)}
                    onChange={(e) => {
                      setVisibleCols(
                        e.target.checked
                          ? [...visibleCols, c.key]
                          : visibleCols.filter((k) => k !== c.key),
                      );
                    }}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
