import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Calculator, BarChart3, Users, Landmark, Settings, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { CompanyProfile } from '../types';
import eventBus from '../utils/eventBus';
import { apiService } from '../services/api';

interface SidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { 
    icon: FileText, 
    label: 'Sales', 
    path: '/sales',
    children: [
        { label: 'Invoices', path: '/sales/invoices' },
        { label: 'Recurring Invoices', path: '/sales/recurring' },
        { label: 'Quotes', path: '/sales/quotes' },
        { label: 'Products & Services', path: '/sales/products' },
    ]
  },
  { 
    icon: Calculator, 
    label: 'Accounting', 
    path: '/accounting',
    children: [
        { label: 'Purchases', path: '/accounting/purchases' },
        { label: 'Templates', path: '/accounting/templates' },
        { label: 'Petty Cash', path: '/accounting/petty-cash' },
    ]
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    path: '/reports',
    children: [
        { label: 'Trial Balance', path: '/reports/trial-balance' },
        { label: 'Posting', path: '/reports/posting' },
        { label: 'Corporate Tax', path: '/reports/corporate-tax' },
        { label: 'Cash Flow', path: '/reports/cash-flow' },
        { label: 'VAT Report', path: '/reports/vat' },
        { label: 'Aged Debtors', path: '/reports/aged-debtors' },
        { label: 'Aged Creditors', path: '/reports/aged-creditors' },
        { label: 'Statement', path: '/reports/statement' },
        { label: 'Balance Sheet', path: '/reports/balance-sheet' },
        { label: 'Profit & Loss', path: '/reports/profit-loss' },
    ]
  },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: Landmark, label: 'Bank', path: '/banks' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setOpen }) => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', email: '', phone: '', logoUrl: '' });
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const profile = await apiService.getCompanyProfile();
        setCompanyProfile(profile as CompanyProfile);
      } catch (e) {
        console.error('Failed to load company profile:', e);
      }
    };
    refreshProfile();
    const unsubscribe = eventBus.on('dataChanged', refreshProfile);
    return () => unsubscribe();
  }, []);

  // FIX: Add useEffect to dynamically open the correct submenu based on the current route.
  useEffect(() => {
    const path = location.pathname;
    // Preserve manually opened submenus while auto-opening the current section
    setOpenSubmenus(prev => ({
        ...prev,
        Sales: path.startsWith('/sales'),
        Accounting: path.startsWith('/accounting'),
        Reports: path.startsWith('/reports'),
    }));
  }, [location.pathname]);

  const toggleSubmenu = (label: string) => {
      setOpenSubmenus(prev => ({...prev, [label]: !prev[label]}));
  };

  return (
    <div className={`relative h-full bg-dark text-white transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        {isOpen && <h1 className="text-xl font-bold text-white truncate" title={companyProfile.name}>{companyProfile.name}</h1>}
        <button onClick={() => setOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-700">
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      <nav className="mt-6 flex-grow overflow-y-auto">
        <ul className="pb-6">
          {navItems.map((item) => {
            const isSectionActive = item.path && location.pathname.startsWith(item.path);

            return (
                <li key={item.path} className="px-4 mb-2">
                {item.children ? (
                    <>
                    <button onClick={() => toggleSubmenu(item.label)} className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors duration-200 hover:bg-gray-700 ${isSectionActive && !openSubmenus[item.label] ? 'bg-gray-700' : ''}`}>
                        <div className="flex items-center">
                            <item.icon size={24} />
                            {isOpen && <span className="ml-4 font-medium">{item.label}</span>}
                        </div>
                        {isOpen && <ChevronDown size={16} className={`transition-transform ${openSubmenus[item.label] ? 'rotate-180' : ''}`} />}
                    </button>
                    {openSubmenus[item.label] && isOpen && (
                        <ul className="pl-8 mt-2 space-y-2">
                        {item.children.map(child => (
                            <li key={child.path}>
                            <NavLink to={child.path} className={({isActive}) => `block text-sm p-2 rounded-md ${isActive ? 'bg-secondary text-white' : 'hover:bg-gray-700'}`}>
                                {child.label}
                            </NavLink>
                            </li>
                        ))}
                        </ul>
                    )}
                    </>
                ) : (
                    <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                        `flex items-center p-2 rounded-lg transition-colors duration-200 ${
                        isActive ? 'bg-secondary text-white' : 'hover:bg-gray-700'
                        } ${!isOpen ? 'justify-center' : ''}`
                    }
                    >
                    <item.icon size={24} />
                    {isOpen && <span className="ml-4 font-medium">{item.label}</span>}
                    </NavLink>
                )}
                </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;