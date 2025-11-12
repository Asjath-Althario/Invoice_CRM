import React, { useState, useEffect } from 'react';
import { Building, Users, Sliders, Zap, Save, Plus, X, Edit, Trash2, UploadCloud } from 'lucide-react';
import { apiService } from '../services/api';
import type { CompanyProfile, User, Preferences, Integration } from '../types';
import eventBus from '../utils/eventBus';
import { applyTheme } from '../utils/theme';


const UserModal = ({ user, onClose, onSave }: { user: Partial<User> | null, onClose: () => void, onSave: (email: string, role: 'Admin' | 'Member', id?: string) => void }) => {
    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState<'Admin' | 'Member'>(user?.role || 'Member');

    if (!user) return null;
    const isEditing = !!user.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(email, role, user.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">{isEditing ? 'Edit User Role' : 'Invite New User'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEditing} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option>Member</option>
                            <option>Admin</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">{isEditing ? 'Save Changes' : 'Send Invite'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const avatarColors = [
    'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300',
    'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300',
    'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
    'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300',
];
const getColorForName = (name: string) => {
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[charCodeSum % avatarColors.length];
};

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');
    
    // States for each section
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
    const [users, setUsers] = useState<User[]>([]);
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);

    const refreshData = async () => {
        try {
            const [profile, usersData, prefsData] = await Promise.all([
                apiService.getCompanyProfile(),
                apiService.getUsers(),
                apiService.getPreferences()
            ]);
            // TODO: Add integrations API when backend supports it
            const integrationsData: Integration[] = [];
            setCompanyProfile(profile as CompanyProfile);
            setLogoPreview((profile as CompanyProfile).logoUrl);
            setUsers(usersData);
            setPreferences(prefsData);
            setIntegrations(integrationsData);
        } catch (error) {
            console.error('Failed to load settings data:', error);
        }
    };

    useEffect(() => {
        refreshData(); // Load data on component mount
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCompanyProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB size limit (aligned with backend)
                alert('Logo image is too large. Please select an image smaller than 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                setCompanyProfile(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (companyProfile) {
            try {
                await apiService.updateCompanyProfile(companyProfile);
                alert('Company profile updated!');
            } catch (error) {
                console.error('Failed to update company profile:', error);
                // Surface backend details if present in error message
                alert('Failed to update company profile. ' + (error instanceof Error ? error.message : 'Please try again.'));
            }
        }
    };

    const handleUserSave = async (email: string, role: 'Admin' | 'Member', id?: string) => {
        try {
            if (id) {
                const userToUpdate = users.find(u => u.id === id);
                if (userToUpdate) {
                    // TODO: Add updateUser API when backend supports it
                    console.log('Update user:', { ...userToUpdate, role });
                }
            } else {
                // TODO: Add inviteUser API when backend supports it
                console.log('Invite user:', email, role);
            }
            setSelectedUser(null);
            refreshData();
        } catch (error) {
            console.error('Failed to save user:', error);
        }
    };

    const handleUserDelete = async (userId: string) => {
        if (window.confirm('Are you sure you want to remove this user?')) {
            try {
                // TODO: Add deleteUser API when backend supports it
                console.log('Delete user:', userId);
                refreshData();
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    };
    
    const handlePreferencesChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const { checked } = e.target as HTMLInputElement;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setPreferences(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof Preferences] as object),
                    [child]: type === 'checkbox' ? checked : value,
                }
            }));
        } else {
            const newValue = type === 'number' ? Number(value) : value;
            setPreferences(prev => ({ ...prev, [name]: newValue }));
        }
    };

     const handlePreferencesSave = async () => {
       if (preferences) {
           try {
               const updated = await apiService.updatePreferences(preferences);
               // Persist state and apply theme immediately
               const updatedPrefs = updated as Preferences;
               setPreferences(updatedPrefs);
               applyTheme(updatedPrefs.theme as 'Light' | 'Dark');
               alert('Preferences updated!');
           } catch (error) {
               console.error('Failed to update preferences:', error);
               alert('Failed to update preferences. Please try again.');
           }
       }
   };

   const handleIntegrationToggle = async (id: string) => {
       const integration = integrations.find(i => i.id === id);
       if (integration) {
           try {
               // TODO: Add updateIntegrationStatus API when backend supports it
               console.log('Toggle integration:', id, !integration.isConnected);
               refreshData();
           } catch (error) {
               console.error('Failed to update integration:', error);
           }
       }
   };

    const navItems = [
        { id: 'profile', label: 'Company Profile', icon: Building },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'preferences', label: 'Preferences', icon: Sliders },
        { id: 'integrations', label: 'Integrations', icon: Zap },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <form onSubmit={handleProfileSave} className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold mb-1 dark:text-white">Company Logo & Branding</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update your company logo.</p>
                             <div className="flex items-center space-x-6">
                                <img src={logoPreview || "https://picsum.photos/100"} alt="Company Logo" className="w-20 h-20 rounded-full object-cover bg-gray-200 ring-4 ring-white dark:ring-gray-700" />
                                <div className="flex-1">
                                     <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud size={24} className="text-gray-500 dark:text-gray-400 mb-2"/>
                                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            {/* FIX: Adjust max size text from 1MB to 2MB to match backend */}
                                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF (MAX. 2MB)</p>
                                        </div>
                                        <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoChange}/>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                             <h3 className="text-lg font-semibold mb-1 dark:text-white">Company Details</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update your company information.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                                    <input type="text" name="name" value={companyProfile?.name || ''} onChange={handleProfileChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                                    <input type="url" name="website" value={companyProfile?.website || ''} onChange={handleProfileChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
                                    <input type="text" name="taxId" value={companyProfile?.taxId || ''} onChange={handleProfileChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input type="email" name="email" value={companyProfile?.email || ''} onChange={handleProfileChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                    <input type="tel" name="phone" value={companyProfile?.phone || ''} onChange={handleProfileChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <input type="text" name="address" value={companyProfile?.address || ''} onChange={handleProfileChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"/>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" className="flex items-center bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary/90 transition-colors"><Save size={18} className="mr-2"/>Save Changes</button>
                        </div>
                    </form>
                );
            case 'users':
                return (
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 p-6">
                             <h3 className="text-lg font-semibold dark:text-white">User Management</h3>
                             <button onClick={() => setSelectedUser({})} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm shadow-md hover:bg-primary/90"><Plus size={18} className="mr-2"/>Invite User</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${getColorForName(user.name)}`}>
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="font-medium dark:text-gray-200">{user.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm dark:text-gray-300">{user.role}</td>
                                            <td className="px-6 py-4"><span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>{user.status}</span></td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => setSelectedUser(user)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Edit size={16}/></button>
                                                <button onClick={() => handleUserDelete(user.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'preferences':
                 return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold dark:text-gray-200">Appearance & Localization</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel of the application.</p>
                            </div>
                            <div className="border-t dark:border-gray-700 p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</label>
                                    <select name="theme" value={preferences.theme} onChange={handlePreferencesChange} className="mt-1 block w-full max-w-xs bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md">
                                        <option>Light</option>
                                        <option>Dark</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Format</label>
                                    <select name="dateFormat" value={preferences.dateFormat} onChange={handlePreferencesChange} className="mt-1 block w-full max-w-xs bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md">
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                                    <select name="defaultCurrency" value={preferences.defaultCurrency} onChange={handlePreferencesChange} className="mt-1 block w-full max-w-xs bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md">
                                        <option>USD</option><option>EUR</option><option>GBP</option><option>AED</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Financial Settings Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold dark:text-gray-200">Financial Settings</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure accounting defaults.</p>
                            </div>
                            <div className="border-t dark:border-gray-700 p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default VAT / Tax Rate (%)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step={0.5}
                                      name="defaultTaxRate"
                                      value={preferences.defaultTaxRate}
                                      onChange={handlePreferencesChange}
                                      className="mt-1 block w-full max-w-xs bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md px-3 py-2 border border-gray-300 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Used for automatic tax calculations on invoices, quotes, purchases & recurring invoices.</p>
                            </div>
                        </div>

                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                             <h3 className="text-lg font-semibold dark:text-gray-200">Communication</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your communication templates and notifications.</p>
                            <div className="pt-4 mt-4 border-t dark:border-gray-700 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Message Template</label>
                                    <textarea name="whatsappMessageTemplate" value={preferences.whatsappMessageTemplate || ''} onChange={handlePreferencesChange} rows={6} className="mt-1 block w-full bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md border border-gray-300 shadow-sm sm:text-sm focus:ring-primary focus:border-primary"/>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Placeholders: [CustomerName], [InvoiceNumber], [TotalAmount], [Your Name / Company Name], [Contact Number]</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Terms & Conditions</label>
                                    <textarea name="invoiceTerms" value={preferences.invoiceTerms || ''} onChange={handlePreferencesChange} rows={6} className="mt-1 block w-full bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md border border-gray-300 shadow-sm sm:text-sm focus:ring-primary focus:border-primary" placeholder={"Enter default terms shown on printed invoices"}/>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Will appear under "Terms & Conditions" on printed invoices.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                                    <div className="mt-2 space-y-2">
                                        <label className="flex items-center"><input type="checkbox" name="notifications.weeklySummary" checked={preferences.notifications.weeklySummary} onChange={handlePreferencesChange} className="rounded text-primary focus:ring-primary"/> <span className="ml-2 text-sm dark:text-gray-300">Weekly Summary</span></label>
                                        <label className="flex items-center"><input type="checkbox" name="notifications.invoicePaid" checked={preferences.notifications.invoicePaid} onChange={handlePreferencesChange} className="rounded text-primary focus:ring-primary"/> <span className="ml-2 text-sm dark:text-gray-300">Invoice Paid Alerts</span></label>
                                        <label className="flex items-center"><input type="checkbox" name="notifications.quoteAccepted" checked={preferences.notifications.quoteAccepted} onChange={handlePreferencesChange} className="rounded text-primary focus:ring-primary"/> <span className="ml-2 text-sm dark:text-gray-300">Quote Accepted Alerts</span></label>
                                    </div>
                                </div>
                            </div>
                         </div>
                        
                        <div className="flex justify-end pt-2">
                            <button onClick={handlePreferencesSave} className="flex items-center bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary/90 transition-colors"><Save size={18} className="mr-2"/>Save Preferences</button>
                        </div>
                    </div>
                );
            case 'integrations':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold dark:text-white">Integrations</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Connect your favorite apps to streamline your workflow.</p>
                        </div>
                        <div className="space-y-0">
                            {integrations.map(int => (
                                <div key={int.id} className="flex justify-between items-center p-4 border-t dark:border-gray-700">
                                    <div className="flex items-center">
                                        <img src={int.logo} alt={int.name} className="w-12 h-12 mr-4 rounded-md"/>
                                        <div>
                                            <h4 className="font-semibold dark:text-white">{int.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{int.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-sm font-medium ${int.isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {int.isConnected ? 'Connected' : 'Disconnected'}
                                        </span>
                                        <label htmlFor={`toggle-${int.id}`} className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input type="checkbox" id={`toggle-${int.id}`} className="sr-only" checked={int.isConnected} onChange={() => handleIntegrationToggle(int.id)} />
                                                <div className={`block w-14 h-8 rounded-full transition-colors ${int.isConnected ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform ${int.isConnected ? 'transform translate-x-6' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-dark dark:text-light">Settings</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <nav className="flex space-x-1 p-1" aria-label="Tabs">
                    {navItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`${
                            activeTab === item.id
                              ? 'bg-primary text-white'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          } flex items-center whitespace-nowrap py-2 px-4 rounded-md font-medium text-sm transition-colors`}
                        >
                          <item.icon size={16} className="mr-2" />
                          {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="animate-fade-in-up">
                {renderContent()}
            </main>

            {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onSave={handleUserSave}/>}
        </div>
    );
};

export default Settings;