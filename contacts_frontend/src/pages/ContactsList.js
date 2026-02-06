import React, { useEffect, useMemo, useRef, useState } from "react";
import { listContacts } from "../api/contacts";
import SearchBar from "../components/SearchBar";
import styles from "./ContactsList.module.css";

function normalizeContact(raw) {
  // Accept multiple possible backend shapes.
  return {
    id: raw.id ?? raw.contact_id ?? raw.uuid ?? raw._id ?? "",
    name: raw.name ?? raw.full_name ?? raw.fullName ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? raw.phone_number ?? raw.phoneNumber ?? "",
    address: raw.address ?? raw.location ?? ""
  };
}

function nextOrder(current) {
  return current === "asc" ? "desc" : "asc";
}

// PUBLIC_INTERFACE
export default function ContactsList() {
  /** Page for listing/searching contacts with server query + sorting + basic pagination. */
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef(null);

  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Reset to first page when query/sort changes
  useEffect(() => {
    setPage(1);
  }, [q, sort, order]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError("");

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const resp = await listContacts({
          q,
          sort,
          order,
          page,
          pageSize,
          signal: controller.signal
        });

        if (!mounted) return;

        const normalized = (resp.items || []).map(normalizeContact);
        setItems(normalized);
        setTotal(typeof resp.total === "number" ? resp.total : normalized.length);
      } catch (e) {
        if (!mounted) return;
        if (e && e.name === "AbortError") return;
        setError(e?.message || "Failed to load contacts.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [q, sort, order, page, pageSize]);

  function onToggleSort(field) {
    if (sort === field) {
      setOrder((o) => nextOrder(o));
    } else {
      setSort(field);
      setOrder("asc");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <SearchBar value={q} onChange={setQ} placeholder="Search by name, email, phone, address…" />
        <div className={styles.sortPanel} aria-label="Sort controls">
          <div className={styles.sortTitle}>Sort</div>

          <button
            type="button"
            className={`${styles.sortBtn} ${sort === "name" ? styles.active : ""}`}
            onClick={() => onToggleSort("name")}
            aria-pressed={sort === "name"}
          >
            Name <span className={styles.order}>{sort === "name" ? (order === "asc" ? "↑" : "↓") : ""}</span>
          </button>

          <button
            type="button"
            className={`${styles.sortBtn} ${sort === "email" ? styles.active : ""}`}
            onClick={() => onToggleSort("email")}
            aria-pressed={sort === "email"}
          >
            Email <span className={styles.order}>{sort === "email" ? (order === "asc" ? "↑" : "↓") : ""}</span>
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelTitle}>Contacts</div>
            <div className={styles.panelMeta}>
              {loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"} · Page ${page} of ${totalPages}`}
            </div>
          </div>

          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pagerBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Prev
            </button>
            <button
              type="button"
              className={styles.pagerBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {error ? <div className={styles.error}>Error: {error}</div> : null}

        {loading ? (
          <div className={styles.state}>Fetching contacts…</div>
        ) : items.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.emptyTitle}>No contacts found</div>
            <div className={styles.emptyHint}>Try a different search term or clear the filter.</div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table} role="table">
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Phone</th>
                  <th className={styles.th}>Address</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c, idx) => (
                  <tr key={c.id || `${c.email}-${idx}`} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.primaryCell}>{c.name || "—"}</div>
                    </td>
                    <td className={styles.td}>
                      {c.email ? (
                        <a className={styles.link} href={`mailto:${c.email}`}>
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={styles.td}>
                      {c.phone ? (
                        <a className={styles.link} href={`tel:${c.phone}`}>
                          {c.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.muted}>{c.address || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.footerHint}>
          API base: <code className={styles.code}>{process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}</code>
        </div>
      </div>
    </div>
  );
}

