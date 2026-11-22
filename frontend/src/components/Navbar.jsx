import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Search, Menu, X, User, LogOut, Shield, MessageSquare, PlusCircle, ChevronDown, Package } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-2xl">
              <Search className="h-6 w-6" />
              FindIt
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Home</Link>
              <Link to="/search" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Search Items</Link>
              {user && <Link to="/report" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">Report Item</Link>}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NotificationBell />
                <div className="relative">
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-1 text-gray-700 hover:text-primary-600 focus:outline-none">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                      <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                        <User className="mr-2 h-4 w-4" /> Profile
                      </Link>
                      <Link to="/profile?tab=items" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                        <Package className="mr-2 h-4 w-4" /> My Items
                      </Link>
                      <Link to="/messages" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Messages
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                          <Shield className="mr-2 h-4 w-4" /> Admin
                        </Link>
                      )}
                      <button onClick={() => { logout(); setDropdownOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium text-sm">Login</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-primary-700 transition">Register</Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-700 hover:text-primary-600 focus:outline-none">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/search" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Search Items</Link>
            {user && <Link to="/report" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Report Item</Link>}

            {user ? (
              <>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="px-3 py-2 text-base font-medium text-gray-500">Welcome, {user.name}</div>
                  <Link to="/profile" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Profile</Link>
                  <Link to="/messages" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Messages</Link>
                  <Link to="/notifications" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Notifications</Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600" onClick={() => setMobileOpen(false)}>Admin</Link>
                  )}
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50">Logout</button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 mt-2 pt-2 flex flex-col space-y-2 px-3">
                <Link to="/login" className="block text-center text-gray-700 font-medium py-2 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="block text-center bg-primary-600 text-white font-medium py-2 rounded-md" onClick={() => setMobileOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
