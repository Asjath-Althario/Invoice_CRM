
import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Users, Activity, FileText, Settings } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import { apiService } from '../services/api';
import type { Invoice, Quote, Preferences } from '../types';
import eventBus from '../utils/eventBus';
import CustomizeDashboardModal from '../components/CustomizeDashboardModal';
import UpcomingInvoicesWidget from '../components/UpcomingInvoicesWidget';
import LowStockAlertsWidget from '../components/LowStockAlertsWidget';
import RecentPurchaseOrdersWidget from '../components/RecentPurchaseOrdersWidget';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold dark:text-white">{value}</p>
    </div>
  </div>
);

const SalesChart = ({ salesData }: { salesData: { name: string, sales: number }[] }) => {
    const maxSales = Math.max(...salesData.map(d => d.sales), 1); // Avoid division by zero
    const chartHeight = 200;
    const barWidth = 30;
    const gap = 20;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Sales Overview (Last 6 Months)</h2>
            <svg width="100%" height={chartHeight + 40} aria-label="Sales chart showing last 6 months">
                <g transform="translate(0, 10)">
                    {salesData.map((data, i) => {
                        const barHeight = (data.sales / maxSales) * chartHeight;
                        return (
                            <g key={data.name} transform={`translate(${(barWidth + gap) * i}, 0)`}>
                                <rect
                                    x="0"
                                    y={chartHeight - barHeight}
                                    width={barWidth}
                                    height={barHeight}
                                    className="fill-current text-primary"
                                    rx="4"
                                />
                                <text
                                    x={barWidth / 2}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    className="text-xs fill-current text-gray-500 dark:text-gray-400"
                                >
                                    {data.name}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

const RecentActivityWidget = ({ recentActivities }: { recentActivities: (Invoice | Quote)[] }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Activity</h2>
        <ul className="space-y-4">
            {recentActivities.map(activity => {
                const activityType = 'invoiceNumber' in activity ? 'Invoice' : 'Quote';
                return (
                 <li key={`${activityType}-${activity.id}`} className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 mt-1 ${activityType === 'Invoice' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                        <FileText size={16} className={activityType === 'Invoice' ? 'text-primary' : 'text-secondary'}/>
                    </div>
                    <div>
                        <p className="text-sm font-medium dark:text-gray-200">
                            {activityType === 'Invoice' 
                                ? `Invoice #${(activity as Invoice).invoiceNumber} created for ${activity.contact.name}`
                                : `Quote #${(activity as Quote).quoteNumber} created for ${activity.contact.name}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.issueDate}</p>
                    </div>
                </li>
            )})}
        </ul>
    </div>
);


const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCustomers: 0,
        pendingAmount: 0,
        salesThisMonth: 0,
    });
    const [recentActivities, setRecentActivities] = useState<(Invoice | Quote)[]>([]);
    const [salesChartData, setSalesChartData] = useState<{name: string, sales: number}[]>([]);
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

    const calculateData = async () => {
        try {
            const [invoicesData, contactsData, prefs] = await Promise.all([
                apiService.getInvoices(),
                apiService.getContacts(),
                apiService.getPreferences()
            ]);

            const invoices = invoicesData as any[];
            const contacts = contactsData as any[];

            const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.total_amount || inv.total), 0);
            const totalCustomers = contacts.filter(c => c.type === 'Customer').length;
            const pendingAmount = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + (inv.total_amount || inv.total), 0);

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const salesThisMonth = invoices
                .filter(inv => new Date(inv.issue_date || inv.issueDate) >= firstDayOfMonth)
                .reduce((sum, inv) => sum + (inv.total_amount || inv.total), 0);

            setStats({ totalRevenue, totalCustomers, pendingAmount, salesThisMonth });

            // For now, we'll keep recent activities as empty since we don't have quotes API
            setRecentActivities([]);

            const monthlySales: { [key: string]: number } = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for(let i=5; i>=0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                monthlySales[monthKey] = 0;
            }

            invoices.filter(inv => inv.status === 'Paid').forEach(inv => {
                const d = new Date(inv.issue_date || inv.issueDate);
                const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                if(monthlySales.hasOwnProperty(monthKey)) {
                    monthlySales[monthKey] += (inv.total_amount || inv.total);
                }
            });

            setSalesChartData(Object.entries(monthlySales).map(([name, sales]) => ({ name: name.split(' ')[0], sales })));
            setPreferences(prefs);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    useEffect(() => {
        calculateData();
        const unsubscribe = eventBus.on('dataChanged', calculateData);
        return () => unsubscribe();
    }, []);

    const handleSavePreferences = async (newDashboardWidgets: Preferences['dashboardWidgets']) => {
        if (preferences) {
            try {
                await apiService.updatePreferences({ ...preferences, dashboardWidgets: newDashboardWidgets });
                setPreferences({ ...preferences, dashboardWidgets: newDashboardWidgets });
            } catch (error) {
                console.error('Failed to update preferences:', error);
                alert('Failed to update preferences. Please try again.');
            }
        }
    };

    const enabledWidgets = useMemo(() => {
        if (!preferences?.dashboardWidgets) return [];

        const widgetMap = {
            salesOverview: <SalesChart salesData={salesChartData} />,
            recentActivity: <RecentActivityWidget recentActivities={recentActivities} />,
            upcomingInvoices: <UpcomingInvoicesWidget />,
            lowStockAlerts: <LowStockAlertsWidget />,
            recentPurchases: <RecentPurchaseOrdersWidget />,
        };

        return Object.entries(preferences.dashboardWidgets)
            .filter(([, isEnabled]) => isEnabled)
            .map(([key]) => widgetMap[key as keyof typeof widgetMap]);

    }, [preferences?.dashboardWidgets, salesChartData, recentActivities]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark dark:text-light">Dashboard</h1>
                <button 
                    onClick={() => setIsCustomizeModalOpen(true)}
                    className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    <Settings size={18} className="mr-2" />
                    Customize
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="bg-green-500" />
                <StatCard title="Sales This Month" value={formatCurrency(stats.salesThisMonth)} icon={Activity} color="bg-blue-500" />
                <StatCard title="Total Customers" value={stats.totalCustomers.toString()} icon={Users} color="bg-pink-500" />
                <StatCard title="Pending Invoices" value={formatCurrency(stats.pendingAmount)} icon={FileText} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {enabledWidgets.map((widget, index) => (
                    <div key={index} className={index === 0 && enabledWidgets.length > 1 && (enabledWidgets.length % 2 !== 0 || enabledWidgets.length === 2) ? 'lg:col-span-2' : ''}>
                        {widget}
                    </div>
                ))}
            </div>

            {preferences?.dashboardWidgets && (
                <CustomizeDashboardModal
                    isOpen={isCustomizeModalOpen}
                    onClose={() => setIsCustomizeModalOpen(false)}
                    currentPreferences={preferences.dashboardWidgets}
                    onSave={handleSavePreferences}
                />
            )}
        </div>
    );
};

export default Dashboard;