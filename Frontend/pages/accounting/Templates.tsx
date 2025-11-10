import React from 'react';
import { FileText, Scale, ShoppingCart, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const Templates: React.FC = () => {
    return (
        <div className="space-y-6">
            <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
                <ol className="list-none p-0 inline-flex space-x-2">
                    <li>
                        <Link to="/dashboard" className="hover:text-primary">Lofty</Link>
                    </li>
                    <li>
                        <span>/</span>
                    </li>
                    <li>
                        <Link to="/accounting" className="hover:text-primary">Accounting</Link>
                    </li>
                    <li>
                        <span>/</span>
                    </li>
                    <li className="text-gray-800 font-medium" aria-current="page">Templates</li>
                </ol>
            </nav>
            <h1 className="text-3xl font-bold text-primary">Templates</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="h-40 flex items-center justify-center" style={{backgroundColor: '#e0f2f1'}}>
                        <div className="w-32 h-20 bg-white shadow-lg -rotate-12 flex items-center justify-center p-2">
                           <FileText className="w-16 h-16 text-gray-300" strokeWidth={1}/>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-dark mb-1">Opening Balance</h3>
                        <p className="text-sm text-gray-600">Import your existing business's current state</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="h-40 flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
                        <Scale size={64} className="text-gray-700" strokeWidth={1.5} />
                    </div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-dark mb-1">Currency Adjustment</h3>
                        <p className="text-sm text-gray-600">Balance your foreign currency accounts</p>
                    </div>
                </div>

                 <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="h-40 flex items-center justify-center bg-gray-50">
                         <ShoppingCart size={64} className="text-gray-700" strokeWidth={1.5}/>
                    </div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-dark mb-1">Purchase of goods and services</h3>
                        <p className="text-sm text-gray-600">Track your purchase of goods and services</p>
                    </div>
                </div>
            </div>

            <div className="bg-primary text-white p-8 rounded-lg flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-2">More Templates Coming Soon</h2>
                    <p className="opacity-80 max-w-lg">We're developing a diverse collection of templates to enhance your workflow. Stay tuned for innovative solutions to streamline your business processes.</p>
                </div>
                <Rocket size={64} className="opacity-30" />
            </div>
        </div>
    );
};

export default Templates;