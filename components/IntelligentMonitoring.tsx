import React from 'react';
import { ArrowLeft, Activity, Zap, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface IntelligentMonitoringProps {
  onBack: () => void;
}

const oeeData = [
  { time: '08:00', oee: 85, availability: 90, performance: 95, quality: 99 },
  { time: '10:00', oee: 82, availability: 88, performance: 94, quality: 98 },
  { time: '12:00', oee: 88, availability: 92, performance: 96, quality: 99 },
  { time: '14:00', oee: 86, availability: 91, performance: 95, quality: 99 },
  { time: '16:00', oee: 79, availability: 85, performance: 93, quality: 97 },
  { time: '18:00', oee: 84, availability: 89, performance: 95, quality: 98 },
];

const IntelligentMonitoring: React.FC<IntelligentMonitoringProps> = ({ onBack }) => {
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
            <h1 className="text-2xl font-bold text-slate-800">智能監控</h1>
            <p className="text-sm text-slate-500">當天車間 OEE 等統計信息</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">OEE 總體設備效率</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">84.0%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '84%' }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">可用率 (Availability)</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">89.1%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '89.1%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">表現率 (Performance)</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Zap size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">94.6%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: '94.6%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">質量率 (Quality)</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">98.3%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.3%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Activity size={20} className="mr-2 text-indigo-600" /> OEE 趨勢分析
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={oeeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend />
              <Area type="monotone" dataKey="oee" name="OEE" stroke="#4f46e5" fillOpacity={1} fill="url(#colorOee)" strokeWidth={3} />
              <Area type="monotone" dataKey="availability" name="可用率" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="performance" name="表現率" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="quality" name="質量率" stroke="#10b981" fillOpacity={0} strokeWidth={2} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IntelligentMonitoring;
