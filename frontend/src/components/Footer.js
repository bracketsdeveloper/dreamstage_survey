// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        {/* Brand */}
        <div>
          <Link to="/" className="text-2xl font-semibold text-white">
            YourBrand
          </Link>
          <p className="mt-2 max-w-sm text-sm">
            Empowering businesses with scalable MERN solutions.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Company
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Legal
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social */}
        <div className="flex space-x-6 self-start md:self-center">
          <a href="#" className="hover:text-white">
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.28 4.28 0 001.88-2.36 8.58 8.58 0 01-2.72 1.04 4.27 4.27 0 00-7.36 3.9A12.11 12.11 0 013 4.79a4.27 4.27 0 001.32 5.69 4.22 4.22 0 01-1.94-.54v.05a4.28 4.28 0 003.44 4.19 4.27 4.27 0 01-1.92.07 4.28 4.28 0 003.99 2.97A8.57 8.57 0 012 19.54a12.07 12.07 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19-.01-.38-.02-.56A8.58 8.58 0 0024 5.24a8.4 8.4 0 01-2.54.7z" />
            </svg>
          </a>
          <a href="#" className="hover:text-white">
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2.04c-5.51 0-9.96 4.45-9.96 9.96 0 4.42 2.86 8.17 6.84 9.5.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.61-3.37-1.34-3.37-1.34-.46-1.17-1.11-1.48-1.11-1.48-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.28.1-2.67 0 0 .84-.27 2.74 1.03a9.58 9.58 0 012.49-.34c.84 0 1.68.11 2.49.34 1.9-1.3 2.74-1.03 2.74-1.03.55 1.39.2 2.42.1 2.67.64.7 1.03 1.59 1.03 2.68 0 3.85-2.35 4.7-4.58 4.95.36.31.69.92.69 1.85 0 1.33-.01 2.4-.01 2.72 0 .27.18.59.69.49 3.98-1.33 6.84-5.08 6.84-9.5 0-5.51-4.45-9.96-9.96-9.96z" />
            </svg>
          </a>
          <a href="#" className="hover:text-white">
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h11.12V14.7h-3v-3.6h3v-2.7c0-3 1.79-4.68 4.51-4.68 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.89v2.29h3.34l-.53 3.6h-2.81V24h5.5c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z" />
            </svg>
          </a>
        </div>
      </div>
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-xs">
        &copy; {new Date().getFullYear()} YourBrand. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
