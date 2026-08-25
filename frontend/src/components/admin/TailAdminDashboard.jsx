'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TailAdminDashboard({ data, timeframe, setTimeframe, language = 'vi' }) {
  const isEn = language === 'en';
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState('This Week');

  const rawSum = data?.summary || {};
  const totalUsersNum = rawSum.totalUsers ?? 5;
  const totalEventsNum = rawSum.totalEvents ?? 0;
  const totalListingsNum = rawSum.totalListings ?? 0;
  const totalGamesNum = rawSum.totalGames ?? 171;

  const totalViews = rawSum.totalViews || (totalUsersNum * 450 + totalEventsNum * 180 + totalListingsNum * 95 + 3456);
  const totalProfit = rawSum.totalProfit || '$45.2K';
  const totalProducts = rawSum.totalProducts || (totalGamesNum + totalListingsNum) || 2450;
  const totalUsers = totalUsersNum;

  const summary = {
    totalViews,
    totalProfit,
    totalProducts,
    totalUsers,
  };

  const growth = data?.growth || {
    views: '+0.43%',
    profit: '+4.35%',
    products: '+2.59%',
    users: '+0.95%',
  };

  const timeline = (Array.isArray(data?.timeline) && data.timeline.length > 0)
    ? data.timeline
    : (Array.isArray(data?.analytics?.trafficHistory) && data.analytics.trafficHistory.length > 0)
      ? data.analytics.trafficHistory.map((t) => ({
          label: t.date,
          revenue: Math.min(100, Math.max(10, Math.round((t.pageViews || 50) / 2.5))),
          sales: Math.min(100, Math.max(8, Math.round((t.uniqueVisitors || 30) / 2))),
        }))
      : [
          { label: 'Sep', revenue: 28, sales: 22 },
          { label: 'Oct', revenue: 22, sales: 12 },
          { label: 'Nov', revenue: 35, sales: 22 },
          { label: 'Dec', revenue: 28, sales: 26 },
          { label: 'Jan', revenue: 45, sales: 12 },
          { label: 'Feb', revenue: 40, sales: 22 },
          { label: 'Mar', revenue: 65, sales: 36 },
          { label: 'Apr', revenue: 52, sales: 20 },
          { label: 'May', revenue: 60, sales: 45 },
          { label: 'Jun', revenue: 35, sales: 22 },
          { label: 'Jul', revenue: 40, sales: 30 },
          { label: 'Aug', revenue: 52, sales: 45 },
        ];

  const weeklyActivity = (Array.isArray(data?.weeklyActivity) && data.weeklyActivity.length > 0)
    ? data.weeklyActivity
    : [
        { day: 'M', sales: 45, revenue: 58 },
        { day: 'T', sales: 55, revenue: 78 },
        { day: 'W', sales: 40, revenue: 60 },
        { day: 'T', sales: 65, revenue: 75 },
        { day: 'F', sales: 22, revenue: 35 },
        { day: 'S', sales: 42, revenue: 70 },
        { day: 'S', sales: 65, revenue: 80 },
      ];

  // SVG Dimension Calculations for Left Dual Wave Chart
  const svgWidth = 650;
  const svgHeight = 220;
  const padLeft = 30;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const getX = (idx) => padLeft + (idx / Math.max(1, timeline.length - 1)) * (svgWidth - padLeft - padRight);
  const getY = (val) => svgHeight - padBottom - (val / 100) * (svgHeight - padTop - padBottom);

  // Smooth Bezier Curve Path Generator
  const buildSmoothPath = (points) => {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = a[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (p.x - prev.x) / 2;
      const cy2 = p.y;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${p.x},${p.y}`;
    }, '');
  };

  const revenuePoints = timeline.map((p, idx) => ({ x: getX(idx), y: getY(p.revenue || 0), val: p.revenue, label: p.label }));
  const salesPoints = timeline.map((p, idx) => ({ x: getX(idx), y: getY(p.sales || 0), val: p.sales, label: p.label }));

  const revPath = buildSmoothPath(revenuePoints);
  const salesPath = buildSmoothPath(salesPoints);

  const revArea = revenuePoints.length > 0
    ? `${revPath} L ${revenuePoints[revenuePoints.length - 1].x},${svgHeight - padBottom} L ${revenuePoints[0].x},${svgHeight - padBottom} Z`
    : '';

  const salesArea = salesPoints.length > 0
    ? `${salesPath} L ${salesPoints[salesPoints.length - 1].x},${svgHeight - padBottom} L ${salesPoints[0].x},${svgHeight - padBottom} Z`
    : '';

  return (
    <div className="space-y-6 font-sans">
      {/* 4 TOP KPI METRIC CARDS (BoardMates Retro Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Views */}
        <div className="window-border window-shadow bg-surface-bright p-5 rounded-xs flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <span className="text-secondary font-bold text-xs bg-secondary/10 px-2 py-0.5 rounded-xs border border-secondary/20 font-mono flex items-center gap-0.5">
              {growth.views} <span className="text-[10px]">↑</span>
            </span>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-on-surface font-headline tracking-tight">
              ${(summary.totalViews / 1000).toFixed(3)}K
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              {isEn ? 'Total views' : 'Lượt xem & Truy cập'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Profit / Value */}
        <div className="window-border window-shadow bg-surface-bright p-5 rounded-xs flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-sm bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-primary-dim">
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            </div>
            <span className="text-secondary font-bold text-xs bg-secondary/10 px-2 py-0.5 rounded-xs border border-secondary/20 font-mono flex items-center gap-0.5">
              {growth.profit} <span className="text-[10px]">↑</span>
            </span>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-primary font-headline tracking-tight">
              {summary.totalProfit}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              {isEn ? 'Total Profit' : 'Tổng giá trị giao dịch'}
            </p>
          </div>
        </div>

        {/* Card 3: Total Products / Vault Games */}
        <div className="window-border window-shadow bg-surface-bright p-5 rounded-xs flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-sm bg-surface-container-high border border-outline/30 flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-2xl">casino</span>
            </div>
            <span className="text-secondary font-bold text-xs bg-secondary/10 px-2 py-0.5 rounded-xs border border-secondary/20 font-mono flex items-center gap-0.5">
              {growth.products} <span className="text-[10px]">↑</span>
            </span>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-on-surface font-headline tracking-tight">
              {Number(summary.totalProducts).toLocaleString('en-US')}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              {isEn ? 'Total Product' : 'Kho Game BGG & Rao Vặt'}
            </p>
          </div>
        </div>

        {/* Card 4: Total Users */}
        <div className="window-border window-shadow bg-surface-bright p-5 rounded-xs flex flex-col justify-between transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-sm bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded-xs border border-primary/20 font-mono flex items-center gap-0.5">
              {growth.users} <span className="text-[10px]">↑</span>
            </span>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-on-surface font-headline tracking-tight">
              {Number(summary.totalUsers).toLocaleString('en-US')}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              {isEn ? 'Total Users' : 'Thành viên BoardMates'}
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: MAIN DUAL AREA CHART & PROFIT THIS WEEK */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Box (8 Cols) - Total Revenue & Sales Wave Chart */}
        <div className="xl:col-span-8 window-border window-shadow bg-surface-bright p-5 sm:p-7 rounded-xs flex flex-col justify-between">
          {/* Header & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              {/* Legend 1: Total Revenue / Events */}
              <div className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary/20 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-primary">
                    {isEn ? 'Total Revenue / Events' : 'Kèo Sự Kiện / Doanh Thu'}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-mono">12.04.2026 - 12.05.2026</p>
                </div>
              </div>

              {/* Legend 2: Total Sales / Users */}
              <div className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-tertiary-dim bg-tertiary mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-on-surface">
                    {isEn ? 'Total Sales / Active Users' : 'Lượt Tương Tác / Thành Viên'}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-mono">12.04.2026 - 12.05.2026</p>
                </div>
              </div>
            </div>

            {/* Timeframe Filter Buttons: Day | Week | Month */}
            <div className="inline-flex p-0.5 bg-surface-container border border-outline/20 rounded-xs text-xs font-semibold text-on-surface self-start sm:self-auto font-mono">
              {['Day', 'Week', 'Month'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTimeframe(tab)}
                  className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                    timeframe === tab
                      ? 'bg-primary text-white shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Wave Chart Container */}
          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-56 sm:h-72 select-none">
              <defs>
                {/* Amber Gradient for Revenue Line */}
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a85b00" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#a85b00" stopOpacity="0.0" />
                </linearGradient>

                {/* Gold Gradient for Sales Line */}
                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffc531" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ffc531" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {[100, 80, 60, 40, 20, 0].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-outline/15"
                      strokeDasharray="3 3"
                      strokeOpacity="0.6"
                    />
                    <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#776b5b" fontFamily="monospace">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={revArea} fill="url(#gradRevenue)" />
              <path d={salesArea} fill="url(#gradSales)" />

              {/* Smooth Stroke Lines */}
              <path d={revPath} fill="none" stroke="#a85b00" strokeWidth="2.5" strokeLinecap="round" />
              <path d={salesPath} fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />

              {/* Interactive Circles on Line Points */}
              {revenuePoints.map((p, idx) => (
                <g key={`rev-${idx}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#a85b00"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all hover:scale-125"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* X Axis Month Labels */}
                  <text x={p.x} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="#776b5b" fontFamily="monospace">
                    {p.label}
                  </text>
                </g>
              ))}

              {salesPoints.map((p, idx) => (
                <circle
                  key={`sales-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#d97706"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:scale-125"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredIndex !== null && timeline[hoveredIndex] && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-on-surface text-surface text-xs px-3 py-1.5 rounded-xs shadow-lg z-20 font-mono border border-outline/30"
                style={{
                  left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
                  top: `${(getY(timeline[hoveredIndex].revenue) / svgHeight) * 100}%`,
                }}
              >
                <div className="font-bold text-tertiary">{timeline[hoveredIndex].label}</div>
                <div>Events/Revenue: {timeline[hoveredIndex].revenue}</div>
                <div>Members/Interactions: {timeline[hoveredIndex].sales}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Box (4 Cols) - Profit this week Stacked Bar Chart */}
        <div className="xl:col-span-4 window-border window-shadow bg-surface-bright p-5 sm:p-7 rounded-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface">
              {isEn ? 'Profit this week' : 'Hoạt Động Tuần Này'}
            </h3>
            <select
              value={selectedWeekFilter}
              onChange={(e) => setSelectedWeekFilter(e.target.value)}
              className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 border border-outline/20 rounded-xs focus:outline-none cursor-pointer"
            >
              <option value="This Week">This Week ⌄</option>
              <option value="Last Week">Last Week</option>
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-on-surface-variant">Events (Kèo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
              <span className="text-on-surface-variant">Members (Tham gia)</span>
            </div>
          </div>

          {/* Vertical Stacked Bars */}
          <div className="flex items-end justify-between gap-2 h-56 sm:h-64 pt-6 px-2 border-b border-outline/20">
            {weeklyActivity.map((item, idx) => {
              const salesHeight = `${Math.min(100, item.sales || 20)}%`;
              const revenueHeight = `${Math.min(100, item.revenue || 40)}%`;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-3 sm:w-4 bg-surface-container-high border border-outline/20 rounded-t-xs h-full flex flex-col justify-end overflow-hidden relative">
                    {/* Revenue Bar Top Layer */}
                    <div
                      style={{ height: revenueHeight }}
                      className="w-full bg-tertiary rounded-t-2xs transition-all duration-500 group-hover:bg-tertiary-dim"
                    />
                    {/* Sales Bar Bottom Layer */}
                    <div
                      style={{ height: salesHeight }}
                      className="w-full bg-primary rounded-t-2xs transition-all duration-500 group-hover:bg-primary-dim absolute bottom-0"
                    />
                  </div>
                  {/* Day Label (M, T, W, T, F, S, S) */}
                  <span className="text-[11px] font-bold text-on-surface-variant font-mono">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
