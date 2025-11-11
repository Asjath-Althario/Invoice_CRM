import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// FIX: Imported the 'Settings' icon from lucide-react.
import { Menu, X, Bell, Sun, Moon, User, DollarSign, FileText, AlertTriangle, MessageSquare, LogOut, ChevronDown, Settings } from 'lucide-react';
// import { getNotifications, markAllNotificationsAsRead } from '../data/mockData';
import type { Notification } from '../types';
import { applyTheme } from '../utils/theme';
import eventBus from '../utils/eventBus';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'payment': return <DollarSign className="w-5 h-5 text-green-500" />;
        case 'quote': return <FileText className="w-5 h-5 text-blue-500" />;
        case 'stock': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        default: return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'Light' | 'Dark'>(() => {
    try {
      const raw = localStorage.getItem('zenith-preferences');
      return raw ? (JSON.parse(raw).theme || 'Light') : 'Light';
    } catch {
      return 'Light';
    }
  });
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = () => {
      // TODO: Replace with real backend notifications when available
      setNotifications([]);
  };

  useEffect(() => {
      refreshNotifications();
      const unsubscribe = eventBus.on('dataChanged', refreshNotifications);
      return () => unsubscribe();
  }, []);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
              setNotificationsOpen(false);
          }
          if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
              setProfileOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = async () => {
    const newTheme: 'Light' | 'Dark' = theme === 'Light' ? 'Dark' : 'Light';
    try {
      const currentPrefs = (() => { try { return JSON.parse(localStorage.getItem('zenith-preferences') || '{}'); } catch { return {}; }})();
      const updated = await apiService.updatePreferences({ ...currentPrefs, theme: newTheme });
      try { localStorage.setItem('zenith-preferences', JSON.stringify(updated)); } catch {}
      applyTheme(newTheme);
      setTheme(newTheme);
      eventBus.emit('themeChanged');
    } catch (e) {
      console.error('Failed to toggle theme via API:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
      // Placeholder: no-op until real notifications exist
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white ml-4 hidden sm:block">Welcome Back, {user?.name.split(' ')[0]}!</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          {theme === 'Light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setNotificationsOpen(!isNotificationsOpen)} className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50 animate-fade-in-up">
                    <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
                        <h3 className="font-semibold dark:text-white">Notifications</h3>
                        <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline">Mark all as read</button>
                    </div>
                    <ul className="py-2 max-h-80 overflow-y-auto">
                        {notifications.map(n => (
                            <li key={n.id}>
                                <Link to={n.link} onClick={() => setNotificationsOpen(false)} className={`flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${!n.read ? 'font-semibold' : ''}`}>
                                    <div className="flex-shrink-0 mr-3 mt-1">
                                      <NotificationIcon type={n.type} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${!n.read ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>{n.message}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.date}</p>
                                    </div>
                                     {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-3 mt-2"></div>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                     {notifications.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-8">No notifications yet.</p>
                     )}
                </div>
            )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
               <User size={20} className="text-gray-500 dark:text-gray-300" />
            </div>
            <div className="ml-2 hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <ChevronDown size={16} className="ml-1 text-gray-500 dark:text-gray-400" />
          </button>
          {isProfileOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-50 animate-fade-in-up">
              <div className="py-1">
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings size={16} className="mr-2"/>
                  Settings
                </Link>
                <button onClick={logout} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <LogOut size={16} className="mr-2"/>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;