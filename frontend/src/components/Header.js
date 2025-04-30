// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Header = () => {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  /* keep header in sync with storage changes (e.g. another tab) */
  useEffect(() => {
    const sync = () => setLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 w-full bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <img src={logo} alt="Logo" className="h-14 w-auto" />
            </Link>
            {/* only show nav when logged in */}
            {loggedIn && (
              <nav className="ml-10 hidden space-x-8 md:flex">
                
                <Link
                  to="/manage-questions"
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  Manage Questions
                </Link>
                <Link
                  to="/responses"
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  Manage Responses
                </Link>
              </nav>
            )}
          </div>

          {/* Right side */}
          {!loggedIn ? (
            <Link
              to="/login"
              className="rounded-md border border-blue-600 px-4 py-2 font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white"
            >
              Login
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <svg
                  className="h-5 w-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.121 17.804A9 9 0 0112 15a9 9 0 016.879 2.804M12 12a4 4 0 100-8 4 4 0 000 8z"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-40 rounded-md border bg-white py-2 shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={logout}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
