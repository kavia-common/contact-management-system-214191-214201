import React, { useEffect, useState } from "react";
import "./App.css";
import ContactsList from "./pages/ContactsList";

// PUBLIC_INTERFACE
function App() {
  /** Root app shell: header + main content. */
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark themes. */
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="App">
      <header className="appHeader">
        <div className="headerInner">
          <div className="brand">
            <h1 className="title">Contact Manager</h1>
            <p className="subtitle">Search, sort, and browse your contacts</p>
          </div>

          <button
            className="themeToggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </header>

      <main className="main">
        <ContactsList />
      </main>
    </div>
  );
}

export default App;

