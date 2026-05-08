"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

export function TicketAnalyticsCharts({ data, facultyData }: { data: any[], facultyData: any[] }) {
  const COLORS = ['#F39C12', '#E67E22', '#FFB300', '#D35400', '#F1C40F']

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Volume over time */}
      <div className="bg-card p-6 rounded-xl border shadow-sm h-[400px]">
        <h3 className="text-lg font-semibold mb-4">Haftalik Zayavkalar Hajmi</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
            <Line 
              type="monotone" 
              dataKey="tickets" 
              stroke="#F39C12" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#F39C12' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution by Faculty */}
      <div className="bg-card p-6 rounded-xl border shadow-sm h-[400px]">
        <h3 className="text-lg font-semibold mb-4">Fakultetlar bo'yicha ulush</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={facultyData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {facultyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
