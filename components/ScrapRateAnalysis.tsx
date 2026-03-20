import React from 'react';
import { ArrowLeft, Trash2, AlertOctagon, PackageMinus, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ScrapRateAnalysisProps {
  onBack: () => void;
}

const scrapData = [
  { name: 'SMT 產線 1', rate: 1.2, count: 120 },
  { name: 'SMT 產線 2', rate: 0.8, count: 85 },
  { name: 'DIP 產線 1', rate: 2.1, count: 210 },
  { name: '組裝線 1', rate: 0.5, count: 45 },
  { name: '組裝線 2', rate: 0.4, count: 38 },
  { name: '包裝線', rate: 0.1, count: 12 },
];

const ScrapRateAnalysis: React.FC<ScrapRateAnalysisProps> = ({ onBack }) => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">抛料率分析</h1>
            <p className="text-sm text-slate-500">當天生產抛料率統計信息</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">總抛料率</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Trash2 size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">0.85%</p>
          <p className="text-sm text-green-600 mt-2">↓ 0.2% 較昨日</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">總抛料數量</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <PackageMinus size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">510</p>
          <p className="text-sm text-slate-500 mt-2">件</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">異常產線</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertOctagon size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">1</p>
          <p className="text-sm text-orange-500 mt-2">DIP 產線 1 抛料率偏高</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <BarChartIcon className="mr-2 text-red-500" size={20} /> 各產線抛料率對比
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scrapData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" domain={[0, 3]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="rate" name="抛料率 (%)" radius={[4, 4, 0, 0]}>
                {scrapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.rate > 1.5 ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
              <Bar yAxisId="right" dataKey="count" name="抛料數量" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ScrapRateAnalysis;
