import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30">
                <span className="text-sm font-black">P</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">ProfSale</h3>
                <p className="text-xs text-slate-400">Professional POS</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Professional Point of Sale System for Modern Businesses. Built for
              speed, stock control, and success.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/sales"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  Sales
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/customers"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  Customers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:profsaleug@gmail.com"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  profsaleug@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+256771362017"
                  className="text-sm text-slate-400 transition hover:text-amber-400"
                >
                  +256 771 362 017
                </a>
              </li>
              <li className="text-sm text-slate-400">Kampala, Uganda</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-white/10" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            &copy; {currentYear} ProfSale. All rights reserved.
          </p>
          <p className="text-center text-xs text-slate-500">
            Developed by{' '}
            <span className="font-semibold text-slate-300">
              DangoTech Concepts
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
