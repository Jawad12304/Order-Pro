"use client";

import React, { useRef } from "react";
import { Download, RefreshCw, Printer, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { getTables } from "@/app/actions/tables";
import { useRestaurantId } from "@/hooks/useRestaurantId";

export default function TablesManagementPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const { restaurantId, loading: resLoading } = useRestaurantId();
  const [tables, setTables] = React.useState<any[]>([]);

  const [isAdding, setIsAdding] = React.useState(false);
  const [newTableNum, setNewTableNum] = React.useState(1);
  const [newTableCap, setNewTableCap] = React.useState(4);

  React.useEffect(() => {
    if (resLoading || !restaurantId) return;
    loadTables();
  }, [restaurantId, resLoading]);

  const loadTables = () => {
    if (!restaurantId) return;
    getTables(restaurantId).then(data => {
      setTables(data);
      if (data.length > 0) {
        setNewTableNum(Math.max(...data.map(t => t.number)) + 1);
      }
    }).catch(console.error);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddTable = async () => {
    if (!restaurantId) return;
    try {
      await import("@/app/actions/tables").then(m => m.createTable({
        restaurantId,
        number: newTableNum,
        capacity: newTableCap
      }));
      setIsAdding(false);
      loadTables();
    } catch (e) {
      console.error(e);
      alert("Failed to add table. Number may already exist.");
    }
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
    <div className="animate-in fade-in duration-300 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">Table & QR Management</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Manage your restaurant layout and table ordering codes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-surface border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl font-label-md shadow-sm hover:bg-surface-variant transition-colors print:hidden">
            <Printer size={18} /> Print All QR Codes
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity print:hidden">
            <Plus size={18} /> Add Table
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-surface rounded-2xl p-6 shadow-xl w-[400px]">
            <h3 className="text-title-lg font-bold mb-4">Add New Table</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-label-sm font-bold text-on-surface-variant">Table Number</label>
                <input type="number" value={newTableNum} onChange={e => setNewTableNum(parseInt(e.target.value) || 1)} className="w-full mt-1 p-2 border border-outline-variant/50 rounded-lg bg-surface" />
              </div>
              <div>
                <label className="text-label-sm font-bold text-on-surface-variant">Capacity (Seats)</label>
                <input type="number" value={newTableCap} onChange={e => setNewTableCap(parseInt(e.target.value) || 1)} className="w-full mt-1 p-2 border border-outline-variant/50 rounded-lg bg-surface" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-lg font-label-md hover:bg-surface-variant">Cancel</button>
              <button onClick={handleAddTable} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md shadow-sm">Save Table</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 print:gap-12" ref={printRef}>
        {tables.length === 0 && (
          <div className="col-span-full py-20 text-center bg-surface rounded-2xl border border-outline-variant/30 print:hidden">
            <p className="text-on-surface-variant">No tables added yet.</p>
          </div>
        )}
        {tables.map(table => (
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
                value={`https://${restaurantId}.orderpro.com/menu?table=${table.number}`} 
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#000000"
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
              <button className="flex items-center justify-center gap-2 bg-error-container text-on-error-container py-2.5 rounded-lg font-label-sm hover:opacity-90 transition-colors"
                onClick={async () => {
                  if (confirm('Delete table?')) {
                    await import("@/app/actions/tables").then(m => m.deleteTable(table.id));
                    loadTables();
                  }
                }}
              >
                Delete
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
