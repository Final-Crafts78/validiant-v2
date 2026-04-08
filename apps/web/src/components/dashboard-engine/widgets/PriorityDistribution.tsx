'use client';

import React from 'react';
import { WidgetProps } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Urgent', value: 2, color: '#ef4444' }, // Red
  { name: 'High', value: 5, color: '#f97316' },   // Orange
  { name: 'Medium', value: 8, color: '#3b82f6' }, // Blue
  { name: 'Low', value: 4, color: '#9ca3af' },    // Gray
];

export default function PriorityDistribution({}: WidgetProps) {
  return (
    <div className="flex h-full w-full flex-col relative">
      <div className="h-full w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface-base)', 
                borderColor: 'var(--color-border-base)',
                borderRadius: '8px' 
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="text-center">
             <span className="block text-2xl font-light text-[var(--color-text-base)]">19</span>
             <span className="block text-[8px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider">Tasks</span>
           </div>
        </div>
      </div>
    </div>
  );
}
