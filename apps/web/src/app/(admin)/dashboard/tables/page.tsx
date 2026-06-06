"use client";

import React, { useRef } from "react";
import { Download, RefreshCw, Printer, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const mockTables = [
  { id: "t1", number: 1, capacity: 2, status: "AVAILABLE" },
  { id: "t2", number: 2, capacity: 4, status: "OCCUPIED" },
  { id: "t3", number: 3, capacity: 4, status: "AVAILABLE" },
  { id: "t4", number: 4, capacity: 6, status: "RESERVED" },
  { id: "t5", number: 5, capacity: 2, status: "AVAILABLE" },
  { id: "t6", number: 6, capacity: 8, status: "AVAILABLE" },
];

export default function TablesManagementPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const downloadQR = (tableNum: number) => {
    const svg = document.getElementById(`qr-table-${tableNum}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `table-${tableNum}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">Table & QR Management</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Manage your restaurant layout and table ordering codes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-surface border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl font-label-md shadow-sm hover:bg-surface-variant transition-colors print:hidden">
            <Printer size={18} /> Print All QR Codes
          </button>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity print:hidden">
            <Plus size={18} /> Add Table
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 print:gap-12" ref={printRef}>
        {mockTables.map(table => (
          <div key={table.id} className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center print:break-inside-avoid print:shadow-none print:border-2 print:border-black">
            <div className="w-full flex justify-between items-start mb-6 print:hidden">
              <div>
                <h3 className="text-title-lg font-bold text-on-surface">Table {table.number}</h3>
                <p className="text-body-sm text-on-surface-variant">{table.capacity} Seats</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                ${table.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : ''}
                ${table.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800' : ''}
                ${table.status === 'RESERVED' ? 'bg-orange-100 text-orange-800' : ''}
              `}>
                {table.status}
              </span>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block text-center mb-6 w-full">
              <h2 className="text-3xl font-black text-black">Table {table.number}</h2>
              <p className="text-xl text-gray-600 mt-2">Scan to Order</p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 mb-6 print:border-none print:shadow-none">
              <QRCodeSVG 
                id={`qr-table-${table.number}`}
                value={`https://restaurant.app.com/menu?table=${table.number}`} 
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                imageSettings={{
                  src: "/icons/icon-192x192.png", // Fallback to generic icon if logo fails
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            {/* Actions */}
            <div className="w-full grid grid-cols-2 gap-3 print:hidden">
              <button 
                onClick={() => downloadQR(table.number)}
                className="flex items-center justify-center gap-2 bg-surface-variant text-on-surface py-2.5 rounded-lg font-label-sm hover:bg-outline-variant/30 transition-colors"
              >
                <Download size={16} /> Download
              </button>
              <button className="flex items-center justify-center gap-2 bg-error-container text-on-error-container py-2.5 rounded-lg font-label-sm hover:opacity-90 transition-colors">
                <RefreshCw size={16} /> Regenerate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CSS for printing to hide navigation and only show the grid */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          aside, header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .animate-in {
            animation: none !important;
          }
          .print\\:grid-cols-2 {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:grid-cols-2 * {
            visibility: visible;
          }
        }
      `}} />
    </div>
  );
}
