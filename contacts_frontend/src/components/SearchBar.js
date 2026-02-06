import React, { useEffect, useMemo, useState } from "react";
import styles from "./SearchBar.module.css";

/**
 * Small debounce hook for primitive values.
 * @param {string} value
 * @param {number} delayMs
 */
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

// PUBLIC_INTERFACE
export default function SearchBar({ value, onChange, placeholder = "Search contacts…" }) {
  /** Search input with internal debouncing; emits changes after a short delay. */
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const debounced = useDebouncedValue(local, 350);

  // Keep stable handler identity
  const emit = useMemo(() => onChange, [onChange]);

  useEffect(() => {
    emit(debounced);
  }, [debounced, emit]);

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="contacts-search">
        Search
      </label>
      <input
        id="contacts-search"
        className={styles.input}
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {local ? (
        <button
          type="button"
          className={styles.clear}
          onClick={() => setLocal("")}
          aria-label="Clear search"
          title="Clear"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

