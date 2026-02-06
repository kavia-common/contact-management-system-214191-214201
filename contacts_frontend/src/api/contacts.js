const DEFAULT_PAGE_SIZE = 20;

/**
 * Resolve API base URL. Prefer CRA env var if provided; otherwise default to localhost backend.
 * If a proxy is configured in CRA, the user can set REACT_APP_API_BASE_URL to "/api".
 */
function getApiBaseUrl() {
  return process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
}

/**
 * Build a query string from an object, omitting empty/null values.
 * @param {Record<string, any>} params
 */
function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    sp.set(k, s);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Attempt multiple common endpoints since the backend OpenAPI currently only exposes health-check in the provided spec.
 * This keeps the frontend flexible without modifying backend code in this step.
 */
async function fetchFromCandidateEndpoints({ q, sort, order, page, pageSize, signal }) {
  const base = getApiBaseUrl();
  const size = pageSize ?? DEFAULT_PAGE_SIZE;

  const query = buildQuery({
    q,
    sort,
    order,
    page,
    page_size: size, // common snake_case
    pageSize: size // common camelCase
  });

  // Candidate endpoints (try in order)
  const candidates = [
    `${base}/api/contacts${query}`,
    `${base}/contacts${query}`,
    `${base}/api/contacts/search${query}`,
    `${base}/contacts/search${query}`
  ];

  let lastErr = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Request failed (${res.status}) at ${url}${text ? `: ${text}` : ""}`);
      }

      const data = await res.json();

      // Normalize response shapes:
      // - array of contacts
      // - { items, total, page, page_size }
      // - { data, total }
      if (Array.isArray(data)) {
        return { items: data, total: data.length, page: page ?? 1, pageSize: size };
      }

      const items = data.items || data.data || data.results || [];
      const total =
        typeof data.total === "number"
          ? data.total
          : typeof data.count === "number"
            ? data.count
            : Array.isArray(items)
              ? items.length
              : 0;

      return {
        items: Array.isArray(items) ? items : [],
        total,
        page: data.page ?? page ?? 1,
        pageSize: data.page_size ?? data.pageSize ?? size
      };
    } catch (e) {
      lastErr = e;
      // If aborted, rethrow immediately
      if (e && (e.name === "AbortError" || String(e).includes("AbortError"))) throw e;
    }
  }

  throw lastErr || new Error("Failed to fetch contacts.");
}

// PUBLIC_INTERFACE
export async function listContacts({ q, sort, order, page, pageSize, signal } = {}) {
  /** Fetch contacts with optional query, sorting and pagination. */
  return fetchFromCandidateEndpoints({ q, sort, order, page, pageSize, signal });
}

