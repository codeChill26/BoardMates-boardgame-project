'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnalyticsOverview({ data, language = 'vi' }) {
  const isEn = language === 'en';
  const [selectedMetric, setSelectedMetric] = useState('pageViews'); // 'pageViews' | 'uniqueVisitors' | 'interactions'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data) return null;

  const { summary = {}, analytics = {}, recentUsers = [], recentEvents = [] } = data;
  const trafficHistory = analytics.trafficHistory || [];
  const trafficSources = analytics.trafficSources || [];
  const peakHours = analytics.peakHours || [];
  const demographics = analytics.demographics || [];

  // Tính toán biểu đồ SVG Area / Line Chart
  const maxVal = Math.max(...trafficHistory.map((item) => item[selectedMetric] || 10), 10);
  const minVal = 0;
  const svgWidth = 700;
  const svgHeight = 220;
  const paddingX = 35;
  const paddingY = 25;

  const points = trafficHistory.map((item, idx) => {
    const x = paddingX + (idx / Math.max(1, trafficHistory.length - 1)) * (svgWidth - paddingX * 2);
    const val = item[selectedMetric] || 0;
    const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal || 1)) * (svgHeight - paddingY * 2);
    return { x, y, val, date: item.date, raw: item };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-6 font-sans">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">
              {isEn ? 'Total Users' : 'Tổng Người Dùng'}
            </span>
            <span className="material-symbols-outlined text-primary text-xl">group</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-headline text-on-surface">
              {summary.totalUsers || 0}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {summary.activeUsers || 0} online
            </span>
          </div>
        </div>

        {/* Active Events */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">
              {isEn ? 'Active Events' : 'Kèo Sự Kiện'}
            </span>
            <span className="material-symbols-outlined text-tertiary text-xl">event_available</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-headline text-on-surface">
              {summary.totalEvents || 0}
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {summary.openEvents || 0} đang mở
            </span>
          </div>
        </div>

        {/* Total Listings */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">
              {isEn ? 'Marketplace' : 'Tin Rao Vặt'}
            </span>
            <span className="material-symbols-outlined text-blue-500 text-xl">storefront</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-headline text-on-surface">
              {summary.totalListings || 0}
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {analytics.monthlyActiveGrowth || '+24%'}
            </span>
          </div>
        </div>

        {/* Total Board Games */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">
              {isEn ? 'Game Vault' : 'Kho Game BGG'}
            </span>
            <span className="material-symbols-outlined text-purple-500 text-xl">casino</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-headline text-on-surface">
              {summary.totalGames || '72.4k+'}
            </span>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              {analytics.engagementRate || '68%'} reach
            </span>
          </div>
        </div>
      </div>

      {/* Meta Business Suite Analytics Interactive Chart */}
      <div className="p-4 sm:p-6 rounded-sm bg-surface-container-low border border-outline/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface">
                {isEn ? 'Traffic & Interaction Dynamics (Meta Suite)' : 'Lưu Lượng Truy Cập & Tương Tác (Meta Suite)'}
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isEn ? 'Real-time aggregated metrics over the last 14 days' : 'Thống kê tổng hợp lượt xem, khách truy cập và tương tác trong 14 ngày qua'}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="inline-flex rounded-sm p-0.5 bg-surface-container border border-outline/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedMetric('pageViews')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                selectedMetric === 'pageViews' ? 'bg-primary text-white' : 'text-on-surface hover:text-primary'
              }`}
            >
              {isEn ? 'Page Views' : 'Lượt Xem'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('uniqueVisitors')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                selectedMetric === 'uniqueVisitors' ? 'bg-primary text-white' : 'text-on-surface hover:text-primary'
              }`}
            >
              {isEn ? 'Unique Visitors' : 'Khách Duy Nhất'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('interactions')}
              className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                selectedMetric === 'interactions' ? 'bg-primary text-white' : 'text-on-surface hover:text-primary'
              }`}
            >
              {isEn ? 'Interactions' : 'Tương Tác / Kèo'}
            </button>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full overflow-hidden bg-surface-bright rounded-sm border border-outline/20 p-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 sm:h-60">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = svgHeight - paddingY - pct * (svgHeight - paddingY * 2);
              const labelVal = Math.round(minVal + pct * (maxVal - minVal));
              return (
                <g key={i}>
                  <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <text x={paddingX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.4" fontFamily="monospace">
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            <path d={areaD} fill="url(#areaGrad)" />

            {/* Stroke Line */}
            <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points & Hover Interactivity */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === idx ? '5' : '3'}
                  fill={hoveredPoint === idx ? '#d97706' : '#ffffff'}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Date Label on X Axis */}
                {idx % 2 === 0 && (
                  <text x={p.x} y={svgHeight - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5" fontFamily="monospace">
                    {p.date}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Hover Tooltip Box */}
          {hoveredPoint !== null && points[hoveredPoint] && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-surface-container-highest border border-outline px-2.5 py-1.5 rounded text-xs font-mono shadow-md z-10 text-on-surface"
              style={{
                left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                top: `${(points[hoveredPoint].y / svgHeight) * 100}%`,
              }}
            >
              <div className="font-bold text-primary">{points[hoveredPoint].date}</div>
              <div className="text-[11px]">
                {selectedMetric === 'pageViews' && `👀 ${points[hoveredPoint].val} Lượt xem`}
                {selectedMetric === 'uniqueVisitors' && `👤 ${points[hoveredPoint].val} Khách`}
                {selectedMetric === 'interactions' && `⚡ ${points[hoveredPoint].val} Tương tác`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Traffic Sources, Peak Hours & Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Traffic Sources Breakdown */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">pie_chart</span>
              <span>{isEn ? 'Traffic Sources' : 'Nguồn Truy Cập'}</span>
            </h4>
          </div>

          <div className="space-y-2.5 pt-1">
            {trafficSources.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-on-surface">
                  <span>{s.source}</span>
                  <span className="font-mono">{s.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.percentage}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours Activity */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              <span>{isEn ? 'Peak Hours' : 'Khung Giờ Cao Điểm'}</span>
            </h4>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {peakHours.map((h, idx) => (
              <div key={idx} className="p-2 rounded-xs bg-surface-bright border border-outline/20 text-center">
                <div className="text-[10px] font-mono text-outline">{h.hour}</div>
                <div className="text-xs font-bold text-primary mt-0.5">{h.traffic}%</div>
                <div className="w-full h-1 mt-1 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${h.traffic}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics by City */}
        <div className="p-4 rounded-sm bg-surface-container border border-outline/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">public</span>
              <span>{isEn ? 'Demographics' : 'Khu Vực & Đô Thị'}</span>
            </h4>
          </div>

          <div className="space-y-2 pt-1">
            {demographics.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xs bg-surface-bright border border-outline/20 text-xs">
                <span className="font-semibold text-on-surface">{d.city}</span>
                <span className="font-mono font-bold text-primary">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
