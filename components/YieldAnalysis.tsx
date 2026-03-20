import React from 'react';
import { ArrowLeft, BarChart2, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface YieldAnalysisProps {
  onBack: () => void;
}

const data = [
  { time: '08:00', yield: 98.5, target: 98.0, pass: 1200, fail: 18 },
  { time: '10:00', yield: 97.2, target: 98.0, pass: 1150, fail: 33 },
  { time: '12:00', yield: 99.1, target: 98.0, pass: 1300, fail: 12 },
  { time: '14:00', yield: 98.8, target: 98.0, pass: 1250, fail: 15 },
  { time: '16:00', yield: 96.5, target: 98.0, pass: 1100, fail: 40 },
  { time: '18:00', yield: 98.2, target: 98.0, pass: 1220, fail: 22 },
];

const YieldAnalysis: React.FC<YieldAnalysisProps> = ({ onBack }) => {
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
            <h1 className="text-2xl font-bold text-slate-800">良率分析</h1>
            <p className="text-sm text-slate-500">當天生產良率統計信息</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">當前總良率</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">98.05%</p>
          <p className="text-sm text-green-600 mt-2">↑ 0.5% 較昨日</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">總產出 (Pass)</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">7,220</p>
          <p className="text-sm text-slate-500 mt-2">件</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">不良數 (Fail)</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <XCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">140</p>
          <p className="text-sm text-red-500 mt-2">需關注</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <BarChart2 size={20} className="mr-2 text-blue-600" /> 良率趨勢圖
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[90, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value}%`, '良率']}
              />
              <Legend />
              <Line type="monotone" dataKey="yield" name="實際良率" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="target" name="目標良率" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default YieldAnalysis;
