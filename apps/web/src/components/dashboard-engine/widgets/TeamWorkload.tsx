'use client';

import React from 'react';
import { WidgetProps } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Alice', active: 4, completed: 2 },
  { name: 'Bob', active: 7, completed: 5 },
  { name: 'Charlie', active: 2, completed: 8 },
];

export default function TeamWorkload(_props: WidgetProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="h-full w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
            />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-muted)', opacity: 0.4 }}
              contentStyle={{
                backgroundColor: 'var(--color-surface-base)',
                borderColor: 'var(--color-border-base)',
                borderRadius: '8px',
              }}
            />
            <Bar
              dataKey="active"
              stackId="a"
              fill="var(--color-accent-base)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="completed"
              stackId="a"
              fill="var(--color-surface-soft)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
