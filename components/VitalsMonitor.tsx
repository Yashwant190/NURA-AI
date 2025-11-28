import React, { useEffect, useState } from 'react';
import { VitalsData } from '../types';
import { Activity, Heart, Thermometer, Wind } from 'lucide-react';

interface VitalsMonitorProps {
  data: VitalsData | null;
}

const VitalsMonitor: React.FC<VitalsMonitorProps> = ({ data }) => {
  const [localData, setLocalData] = useState<VitalsData | null>(data);

  useEffect(() => {
    if (data) setLocalData(data);
  }, [data]);

  // Fallback visual if no data yet
  if (!localData) {
    return (
      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
          <p className="text-slate-500 font-mono text-sm">VITALS OFFLINE</p>
          <p className="text-xs text-slate-600">Request check to activate</p>
        </div>
      </div>
    );
  }

  const isWarning = localData.status !== 'Normal';

  return (
    <div className={`backdrop-blur-xl border p-4 rounded-2xl transition-all duration-500 ${isWarning ? 'bg-red-950/30 border-red-500/50' : 'bg-slate-900/60 border-cyan-500/30'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" /> Patient Vitals
        </h3>
        <span className={`text-xs px-2 py-1 rounded border ${isWarning ? 'border-red-500 text-red-400 bg-red-500/10 animate-pulse' : 'border-green-500 text-green-400 bg-green-500/10'}`}>
          {localData.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Heart Rate */}
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Heart className="w-3 h-3 text-pink-500" /> Heart Rate
          </div>
          <div className="text-2xl font-mono text-white">
            {localData.heartRate} <span className="text-xs text-slate-500">BPM</span>
          </div>
          {/* Mock EKG line */}
          <div className="h-1 w-full bg-slate-800 mt-2 overflow-hidden relative rounded-full">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-pink-500/50 animate-[ping_1s_linear_infinite]" style={{ animationDuration: `${60/localData.heartRate}s` }}></div>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
           <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-3 h-3 text-yellow-500" /> BP
          </div>
          <div className="text-2xl font-mono text-white">
            {localData.bloodPressure}
          </div>
          <div className="text-xs text-slate-500 mt-1">mmHg</div>
        </div>

        {/* Oxygen */}
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
           <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Wind className="w-3 h-3 text-cyan-500" /> SpO2
          </div>
          <div className="text-2xl font-mono text-white">
            {localData.oxygenLevel}%
          </div>
           <div className="h-1 w-full bg-slate-800 mt-2 rounded-full">
            <div className="h-full bg-cyan-500" style={{ width: `${localData.oxygenLevel}%` }}></div>
          </div>
        </div>

        {/* Temp */}
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
           <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Thermometer className="w-3 h-3 text-orange-500" /> Temp
          </div>
          <div className="text-2xl font-mono text-white">
            {localData.temperature.toFixed(1)}°C
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsMonitor;
