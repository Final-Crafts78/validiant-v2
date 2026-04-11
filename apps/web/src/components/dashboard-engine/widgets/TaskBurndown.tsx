'use client';

import React from 'react';
import { WidgetProps } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data until historical tasks are saved
const data = [
  { name: 'Mon', tasks: 12 },
  { name: 'Tue', tasks: 10 },
  { name: 'Wed', tasks: 8 },
  { name: 'Thu', tasks: 7 },
  { name: 'Fri', tasks: 4 },
  { name: 'Sat', tasks: 2 },
  { name: 'Sun', tasks: 0 },
];

export default function TaskBurndown(_props: WidgetProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="h-full w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-base)"
              opacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="var(--color-text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-base)',
                borderColor: 'var(--color-border-base)',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="var(--color-accent-base)"
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--color-surface-base)', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
