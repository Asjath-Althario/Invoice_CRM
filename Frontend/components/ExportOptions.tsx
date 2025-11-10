import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface ExportOptionsProps {
    reportName: string;
    csvGenerator: () => string;
}

const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const ExportOptions: React.FC<ExportOptionsProps> = ({ reportName, csvGenerator }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
        setIsOpen(false);
        const slug = reportName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
        
        switch (format) {
            case 'PDF':
                window.print();
                break;
            case 'CSV':
                const csvData = csvGenerator();
                downloadFile(csvData, `${slug}-report.csv`, 'text/csv;charset=utf-8;');
                break;
            case 'Excel':
                 // Excel can open CSVs, so we use the same generator for simplicity
                 const excelData = csvGenerator();
                 downloadFile(excelData, `${slug}-report.xlsx`, 'application/vnd.ms-excel;charset=utf-8;');
                break;
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-primary" id="menu-button" aria-expanded="true" aria-haspopup="true">
                    <Download size={16} className="mr-2" />
                    Export
                    <ChevronDown size={16} className="-mr-1 ml-2" />
                </button>
            </div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                    <div className="py-1" role="none">
                        <button onClick={() => handleExport('PDF')} className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100" role="menuitem">PDF</button>
                        <button onClick={() => handleExport('Excel')} className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100" role="menuitem">Excel (XLSX)</button>
                        <button onClick={() => handleExport('CSV')} className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100" role="menuitem">CSV</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportOptions;