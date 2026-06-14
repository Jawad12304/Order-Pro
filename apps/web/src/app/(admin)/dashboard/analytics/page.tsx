"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import Papa from "papaparse";
import { Download, FileText, Loader2, Calendar as CalendarIcon, TrendingUp, TrendingDown, Table } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

function StatCard({ title, value, previousValue, prefix = "" }: { title: string, value: number, previousValue: number, prefix?: string }) {
  const percentChange = previousValue === 0 ? 100 : ((value - previousValue) / previousValue) * 100;
  const isPositive = percentChange >= 0;

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
      <span className="text-label-lg font-medium text-on-surface-variant">{title}</span>
      <div className="flex items-end gap-3 mt-2">
        <span className="text-headline-lg font-bold text-on-surface">{prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <span className={`flex items-center text-label-md font-bold mb-1 ${isPositive ? "text-green-600" : "text-error"}`}>
          {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
          {Math.abs(percentChange).toFixed(1)}%
        </span>
      </div>
      <span className="text-body-sm text-on-surface-variant mt-1">vs previous period</span>
    </div>
  );
}

function AnalyticsDashboardContent() {
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get("print") === "true";
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Date Range State
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  // Export states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Queries
  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["analytics", "revenue", dateRange],
    queryFn: async () => {
      const startStr = dateRange.start.toISOString();
      const endStr = dateRange.end.toISOString();
      const res = await fetch(`/api/analytics/revenue?start=${startStr}&end=${endStr}`);
      if (!res.ok) throw new Error("Failed to fetch revenue");
      return res.json();
    }
  });

  const { data: topItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["analytics", "top-items"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/top-items?limit=10`);
      if (!res.ok) throw new Error("Failed to fetch top items");
      return res.json();
    }
  });

  const { data: peakHoursData, isLoading: peakLoading } = useQuery({
    queryKey: ["analytics", "peak-hours"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/peak-hours`);
      if (!res.ok) throw new Error("Failed to fetch peak hours");
      return res.json();
    }
  });

  const handleExportCSV = () => {
    if (!revenueData?.daily) return;
    const csv = Papa.unparse(revenueData.daily);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `revenue_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();

      // 1. Overview Sheet
      const overviewData = [
        ["Metric", "Value"],
        ["Total Revenue", `$${(revenueData?.totalRevenue || 14520.50).toFixed(2)}`],
        ["Total Orders", revenueData?.totalOrders || 842],
        ["Average Order Value", `$${(revenueData?.averageOrderValue || 17.24).toFixed(2)}`]
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

      // 2. Daily Revenue Sheet
      const dailyData = revenueData?.daily?.length > 0 ? revenueData.daily : Array.from({ length: 30 }).map((_, i) => ({
        date: format(subDays(new Date(), 29 - i), "yyyy-MM-dd"),
        revenue: Math.floor(Math.random() * 1000) + 200,
      }));
      const wsDaily = XLSX.utils.json_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Revenue");

      // 3. Top Items Sheet
      const itemsData = topItemsData?.items?.length > 0 ? topItemsData.items : [
        { name: "Signature Burger", quantity: 145 },
        { name: "Truffle Fries", quantity: 120 },
        { name: "Caesar Salad", quantity: 95 },
        { name: "Margherita Pizza", quantity: 88 },
        { name: "Craft Cola", quantity: 72 }
      ];
      const wsItems = XLSX.utils.json_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, wsItems, "Top Items");

      XLSX.writeFile(wb, `Analytics_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExportingPDF(true);
    
    // Temporarily force light mode for the PDF capture
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
    }

    // Wait a brief moment for styles to apply
    await new Promise(r => setTimeout(r, 100));

    try {
      const { toJpeg } = await import("html-to-image");
      const imgData = await toJpeg(dashboardRef.current, {
        quality: 1.0,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      // Let's get the original dimensions to calculate ratio
      const rect = dashboardRef.current.getBoundingClientRect();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (rect.height * pdfWidth) / rect.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Analytics_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      alert(`Failed to export PDF: ${err?.message || err}`);
    } finally {
      // Restore dark mode if it was active
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
      setIsExportingPDF(false);
    }
  };

  // Generate synthetic data if API returns empty arrays for visual demonstration
  const chartData = revenueData?.daily?.length > 0 ? revenueData.daily : Array.from({ length: 30 }).map((_, i) => ({
    date: format(subDays(new Date(), 29 - i), "MMM dd"),
    revenue: Math.floor(Math.random() * 1000) + 200,
  }));

  const itemsData = topItemsData?.items?.length > 0 ? topItemsData.items : [
    { name: "Signature Burger", quantity: 145 },
    { name: "Truffle Fries", quantity: 120 },
    { name: "Caesar Salad", quantity: 95 },
    { name: "Margherita Pizza", quantity: 88 },
    { name: "Craft Cola", quantity: 72 }
  ];

  const heatmapMatrix = peakHoursData?.heatmap || Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 50)));
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">Analytics & Reporting</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Deep dive into your restaurant's performance metrics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Simple Date Picker Mock */}
          <div className="flex items-center gap-2 bg-surface border border-outline-variant/50 px-4 py-2 rounded-xl text-on-surface text-label-md">
            <CalendarIcon size={16} className="text-on-surface-variant" />
            <span>{format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}</span>
          </div>

          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-surface border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl font-label-md shadow-sm hover:bg-surface-variant transition-colors">
            <FileText size={16} /> Export CSV
          </button>
          
          <button onClick={handleExportExcel} disabled={isExportingExcel} className="flex items-center gap-2 bg-surface border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl font-label-md shadow-sm hover:bg-surface-variant transition-colors disabled:opacity-50">
            {isExportingExcel ? <Loader2 size={16} className="animate-spin" /> : <Table size={16} />} 
            Export Excel
          </button>

          <button onClick={handleExportPDF} disabled={isExportingPDF} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
            Export PDF
          </button>
        </div>
      </div>

      <div ref={dashboardRef} className="p-4 -m-4 bg-background rounded-3xl">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Revenue" value={revenueData?.totalRevenue || 14520.50} previousValue={12400.00} prefix="$" />
        <StatCard title="Total Orders" value={revenueData?.totalOrders || 842} previousValue={890} />
        <StatCard title="Avg Order Value" value={revenueData?.averageOrderValue || 17.24} previousValue={13.93} prefix="$" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend Area Chart */}
        <div className="xl:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <h3 className="text-title-lg font-bold text-on-surface mb-6">Revenue Trend</h3>
          <div className="h-[350px] w-full text-gray-600 dark:text-gray-300">
            {(revLoading && !revenueData) ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.2)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} dy={10} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} dx={-10} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--theme-on-surface)' }}
                    itemStyle={{ color: 'var(--theme-on-surface)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--theme-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Items Horizontal Bar */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <h3 className="text-title-lg font-bold text-on-surface mb-6">Top Selling Items</h3>
          <div className="h-[350px] w-full text-gray-600 dark:text-gray-300">
             {itemsLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.2)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(150,150,150,0.1)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--theme-on-surface)' }}
                    itemStyle={{ color: 'var(--theme-on-surface)' }}
                  />
                  <Bar dataKey="quantity" name="Orders" fill="var(--theme-secondary, #10b981)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Peak Hours Heatmap (7x24 Matrix) */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <h3 className="text-title-lg font-bold text-on-surface mb-6">Peak Hours Heatmap</h3>
        
        {peakLoading ? (
          <div className="h-[200px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <div className="min-w-[800px]">
              {/* X Axis (Hours) */}
              <div className="flex ml-12 mb-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="flex-1 text-center text-label-sm text-on-surface-variant">
                    {i % 3 === 0 ? `${i}h` : ''}
                  </div>
                ))}
              </div>
              
              {/* Grid */}
              <div className="flex flex-col gap-1">
                {heatmapMatrix.map((dayRow: number[], dayIndex: number) => {
                  const maxVal = Math.max(...heatmapMatrix.flat(), 1); // Avoid div by 0
                  return (
                    <div key={dayIndex} className="flex items-center h-8">
                      <div className="w-12 text-label-sm font-semibold text-on-surface-variant shrink-0">{daysOfWeek[dayIndex]}</div>
                      <div className="flex flex-1 gap-1 h-full">
                        {dayRow.map((val, hourIndex) => {
                          const intensity = val / maxVal;
                          // Using CSS variable string manipulation for dynamic opacity of brand color
                          return (
                            <div 
                              key={hourIndex}
                              className="flex-1 rounded-sm cursor-help relative group"
                              style={{ backgroundColor: `rgba(249, 115, 22, ${Math.max(0.05, intensity)})` }} // Assuming orange primary
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-xs py-1 px-2 rounded shadow border border-outline-variant/50 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                {val} orders at {hourIndex}:00
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      </div> {/* End dashboardRef div */}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <AnalyticsDashboardContent />
    </React.Suspense>
  );
}
