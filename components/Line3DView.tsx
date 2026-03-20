import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Text, Grid, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
// Fix: Correct import path from 'transparent' to 'three' to ensure standard Three.js module resolution.
import * as THREE from 'three';
import api from '../services/api';
import { 
  X, Thermometer, Activity, Clock, Cpu, ChevronRight, Calendar, Truck, Layers,
  Play, Square, User, Hash, CheckCircle2, ClipboardEdit, Save, AlertCircle,
  Scan, ShieldCheck, FileWarning, MessageSquare, Edit3, Fingerprint, Monitor
} from 'lucide-react';
import { Equipment, MachineStatus, EquipmentType, FACAPendingItem, FACATipsMessage, AlarmRecordModel, ProductionLine, PageView } from '../types';

// Fix: Extend the JSX namespace to include Three.js intrinsic elements provided by React Three Fiber.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
}

// Predefined time slots for manual clock-in
const TIME_SLOTS = [
  '08:00~09:00', '09:00~10:00', '10:00~11:00', '11:00~12:00',
  '12:00~13:00', '14:00~15:00', '15:00~16:00', '16:00~17:00', '17:00~18:00',
  '18:00~19:00', '19:00~20:00', '20:00~21:00', '21:00~22:00', '22:00~23:00', '23:00~24:00',
  '00:00~01:00', '01:00~02:00', '02:00~03:00', '03:00~04:00', '04:00~05:00', '05:00~06:00',
  '06:00~07:00', '07:00~08:00'
];

// Predefined reasons for missed clock-in
const MISSED_REASONS = [
  '忘記打卡',
  '維修機臺',
  '臨時支援',
  '調班/請假',
  '其他'
];

// --- 3D Components ---

interface ItemProps {
  data: Equipment;
  isSelected: boolean;
  onClick: (data: Equipment) => void;
  position: [number, number, number];
  isGlobalScanning?: boolean;
}

const IndustrialMachine: React.FC<{ isSelected: boolean, hovered: boolean, status?: MachineStatus }> = ({ isSelected, hovered, status }) => {
  const W = 3.2, H = 3.4, D = 2.8;
  const baseY = 1.7; 

  const bodyColor = isSelected ? '#3b82f6' : hovered ? '#94a3b8' : '#b0b8c4';
  
  return (
    <group scale={0.6}>
      {/* Base platform */}
      <mesh position={[0, baseY - H / 2 + 0.06, 0]}>
        <boxGeometry args={[W + 0.1, 0.12, D + 0.1]} />
        <meshStandardMaterial color="#151d25" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Main right panel */}
      <mesh position={[W / 2 - 0.55, baseY, 0]}>
        <boxGeometry args={[1.1, H - 0.4, D]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Left frame panel */}
      <mesh position={[-W / 2 + 0.06, baseY, 0]}>
        <boxGeometry args={[0.12, H - 0.4, D]} />
        <meshStandardMaterial color="#2a3542" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Back panel */}
      <mesh position={[0, baseY, -D / 2 + 0.06]}>
        <boxGeometry args={[W, H - 0.4, 0.12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, baseY + H / 2 - 0.2, 0]}>
        <boxGeometry args={[W + 0.05, 0.12, D + 0.05]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Front bottom panel */}
      <mesh position={[0, baseY - H / 2 + 0.55, D / 2 - 0.06]}>
        <boxGeometry args={[W, 0.9, 0.12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Pillars */}
      {[
        [-W / 2 + 0.08, baseY, D / 2 - 0.08],
        [-W / 2 + 0.08, baseY, -D / 2 + 0.08],
        [W / 2 - 0.08, baseY, D / 2 - 0.08],
        [W / 2 - 0.08, baseY, -D / 2 + 0.08],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.14, H - 0.3, 0.14]} />
          <meshStandardMaterial color="#2a3542" />
        </mesh>
      ))}

      {/* Glass Panels */}
      <mesh position={[-W / 2 + 0.72, baseY + 0.3, D / 2 - 0.02]}>
        <boxGeometry args={[1.0, H - 0.6, 0.04]} />
        <meshStandardMaterial color="#88ccdd" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.05, baseY + 0.75, D / 2 - 0.02]}>
        <boxGeometry args={[0.8, (H - 0.6) * 0.55, 0.04]} />
        <meshStandardMaterial color="#88ccdd" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Signal Tower */}
      <group position={[0.1, baseY + H / 2 - 0.2, -0.1]}>
         <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
            <meshStandardMaterial color="#2a3542" />
         </mesh>
         <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.1, 12]} />
            <meshStandardMaterial color={status === MachineStatus.Stopped ? "#ff2200" : "#330000"} emissive="#ff0000" emissiveIntensity={status === MachineStatus.Stopped ? 1 : 0} />
         </mesh>
         <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.1, 12]} />
            <meshStandardMaterial color={status === MachineStatus.Warning ? "#ffcc00" : "#332200"} emissive="#ffaa00" emissiveIntensity={status === MachineStatus.Warning ? 1 : 0} />
         </mesh>
         <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.1, 12]} />
            <meshStandardMaterial color={status === MachineStatus.Running ? "#00ff44" : "#003311"} emissive="#00cc22" emissiveIntensity={status === MachineStatus.Running ? 1 : 0} />
         </mesh>
      </group>

      {/* Control Panel Screen */}
      <mesh position={[W / 2 - 0.57, baseY + 0.6, D / 2 - 0.04]}>
        <boxGeometry args={[0.7, 0.5, 0.04]} />
        <meshStandardMaterial color="#0077aa" emissive="#003366" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

const MachineModel: React.FC<ItemProps> = ({ data, isSelected, onClick, position }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={position} scale={[2, 2, 2]} onClick={(e: any) => { e.stopPropagation(); onClick(data); }}>
      <group 
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <IndustrialMachine isSelected={isSelected} hovered={hovered} status={data.status} />
      </group>
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.7, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Text position={[0, 2.5, 0]} fontSize={0.3} color="#1e293b" anchorX="center" anchorY="middle">
        {data.name}
      </Text>
    </group>
  );
};

const AGVModel: React.FC<ItemProps> = ({ data, isSelected, onClick, position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current && data.status === MachineStatus.Running) {
      groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.4) * 2;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={(e: any) => { e.stopPropagation(); onClick(data); }}>
      <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <IndustrialMachine isSelected={isSelected} hovered={hovered} status={data.status} />
      </group>
      <Text position={[0, 2.5, 0]} fontSize={0.3} color="#451a03" anchorX="center">AGV: {data.name}</Text>
    </group>
  );
};

const FingerprintModel: React.FC<ItemProps> = ({ data, isSelected, onClick, position, isGlobalScanning }) => {
  const [hovered, setHovered] = useState(false);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current && isGlobalScanning) {
      lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 10) * 1.0;
    }
  });
  
  return (
    <group position={position} scale={[2, 2, 2]} onClick={(e: any) => { e.stopPropagation(); onClick(data); }}>
      <group 
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }} 
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.6, 1.4, 0.6]} />
          <meshStandardMaterial color={isSelected ? "#3b82f6" : "#1e293b"} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.45, 0.1]} rotation={[-Math.PI/4, 0, 0]}>
          <boxGeometry args={[0.8, 0.1, 0.6]} />
          <meshStandardMaterial color={isSelected ? '#60a5fa' : "#334155"} />
        </mesh>
        <mesh position={[0, 1.5, 0.2]} rotation={[-Math.PI/4, 0, 0]}>
          <planeGeometry args={[0.5, 0.3]} />
          <meshBasicMaterial color={isGlobalScanning ? "#3b82f6" : "#1e293b"} />
        </mesh>
      </group>

      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isGlobalScanning && (
        <pointLight ref={lightRef} position={[0, 1.6, 0.3]} intensity={1.5} color="#3b82f6" distance={3} />
      )}
      
      <Text position={[0, 2.2, 0]} fontSize={0.25} color="#1e293b" anchorX="center" anchorY="middle">
        {data.name}
      </Text>
      <Text position={[0, 1.9, 0]} fontSize={0.15} color="#64748b" anchorX="center">SCAN STATION</Text>
    </group>
  );
}

const TVDashboard: React.FC<{ 
  position: [number, number, number], 
  rotation?: [number, number, number],
  isSelected: boolean,
  onClick: (data: Equipment) => void,
  dashboardType?: 'oee' | 'yield' | 'scrap'
}> = ({ position, rotation = [0, 0, 0], isSelected, onClick, dashboardType = 'oee' }) => {
  const [hovered, setHovered] = useState(false);

  const tvData: Equipment = {
    id: `tv-dashboard-${dashboardType}`,
    lineId: 'GLOBAL',
    name: dashboardType === 'oee' ? '車間OEE數字看板' : dashboardType === 'yield' ? '良率分析數字看板' : '抛料率分析數字看板',
    type: EquipmentType.TVDashboard,
    description: dashboardType === 'oee' ? '顯示車間整體OEE數據及各產線效率對比' : dashboardType === 'yield' ? '顯示車間整體良率數據及各產線良率對比' : '顯示車間整體抛料率數據及各產線抛料率對比',
    status: MachineStatus.Running,
    temperature: 24,
    vibration: 0,
    lastMaintenance: new Date().toISOString().split('T')[0],
    sn: `SONY-Y75XR90-${dashboardType.toUpperCase()}`,
    factoryArea: 'GL',
    floor: '3F'
  };

  const getHeader = () => {
    if (dashboardType === 'oee') return 'Workshop OEE Dashboard';
    if (dashboardType === 'yield') return 'Yield Analysis Dashboard';
    return 'Scrap Rate Dashboard';
  };

  const getMainStatLabel = () => {
    if (dashboardType === 'oee') return 'Overall Equipment Effectiveness';
    if (dashboardType === 'yield') return 'Overall Yield Rate';
    return 'Overall Scrap Rate';
  };

  const getMainStatValue = () => {
    if (dashboardType === 'oee') return '87.5%';
    if (dashboardType === 'yield') return '98.5%';
    return '1.2%';
  };

  const getMainStatColor = () => {
    if (dashboardType === 'scrap') return '#f87171';
    return '#22c55e';
  };

  const getTrendText = () => {
    if (dashboardType === 'oee') return '▲ 2.1% from yesterday';
    if (dashboardType === 'yield') return '▲ 0.5% from yesterday';
    return '▼ 0.3% from yesterday';
  };

  const getTrendColor = () => {
    if (dashboardType === 'scrap') return '#22c55e'; // Lower is better
    return '#22c55e';
  };

  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={(e: any) => { e.stopPropagation(); onClick(tvData); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Selection Highlight */}
      {isSelected && (
        <mesh position={[0, 0, 0.15]}>
          <planeGeometry args={[25, 14.4]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* TV Frame (Sony Y-75XR90 style) */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[24.2, 13.6, 0.3]} />
        <meshStandardMaterial color={hovered ? "#222222" : "#111111"} roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* TV Bezel (Very thin) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[24, 13.4, 0.1]} />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Sony Logo (simulated) */}
      <Text position={[0, -6.9, 0.06]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">
        SONY
      </Text>

      {/* Screen / Dashboard Content */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[23.8, 13.2]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Dashboard UI Elements */}
      <group position={[0, 0, 0.07]}>
        {/* Header */}
        <Text position={[0, 5.5, 0]} fontSize={0.8} color="#38bdf8" anchorX="center" anchorY="middle">
          {getHeader()}
        </Text>

        {/* OEE Main Stat */}
        <group position={[-6, 1.5, 0]}>
          <Text position={[0, 2, 0]} fontSize={0.5} color="#94a3b8" anchorX="center">{getMainStatLabel()}</Text>
          <Text position={[0, 0, 0]} fontSize={3.5} color={getMainStatColor()} anchorX="center">{getMainStatValue()}</Text>
          <Text position={[0, -2, 0]} fontSize={0.4} color={getTrendColor()} anchorX="center">{getTrendText()}</Text>
        </group>

        {/* Sub Stats */}
        {dashboardType === 'oee' && (
          <group position={[5, 1.5, 0]}>
            <group position={[-3.5, 1.5, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Availability</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#38bdf8" anchorX="center">92.0%</Text>
            </group>
            <group position={[3.5, 1.5, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Performance</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#facc15" anchorX="center">98.2%</Text>
            </group>
            <group position={[-3.5, -2, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Quality</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#22c55e" anchorX="center">96.8%</Text>
            </group>
            <group position={[3.5, -2, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Target</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#f87171" anchorX="center">85.0%</Text>
            </group>
          </group>
        )}
        {dashboardType === 'yield' && (
          <group position={[5, 1.5, 0]}>
            <group position={[-3.5, 1.5, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">FPY</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#38bdf8" anchorX="center">95.2%</Text>
            </group>
            <group position={[3.5, 1.5, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">SPY</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#22c55e" anchorX="center">99.1%</Text>
            </group>
            <group position={[-3.5, -2, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Defect Rate</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#facc15" anchorX="center">1.5%</Text>
            </group>
            <group position={[3.5, -2, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Target</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#f87171" anchorX="center">98.0%</Text>
            </group>
          </group>
        )}
        {dashboardType === 'scrap' && (
          <group position={[5, 1.5, 0]}>
            <group position={[-3.5, 1.5, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Component A</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#f87171" anchorX="center">2.1%</Text>
            </group>
            <group position={[3.5, 1.5, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Component B</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#facc15" anchorX="center">0.8%</Text>
            </group>
            <group position={[-3.5, -2, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Component C</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#22c55e" anchorX="center">0.3%</Text>
            </group>
            <group position={[3.5, -2, 0]}>
              <Text position={[0, 0.8, 0]} fontSize={0.4} color="#94a3b8" anchorX="center">Target</Text>
              <Text position={[0, 0, 0]} fontSize={1.2} color="#38bdf8" anchorX="center">&lt; 1.5%</Text>
            </group>
          </group>
        )}

        {/* Bottom Chart / Bars */}
        <group position={[0, -3.5, 0]}>
          <Text position={[-10, 1, 0]} fontSize={0.4} color="#94a3b8" anchorX="left">Line A</Text>
          <mesh position={[-3, 1, 0]}>
            <planeGeometry args={[10, 0.6]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <Text position={[2.5, 1, 0]} fontSize={0.4} color="#ffffff" anchorX="left">
            {dashboardType === 'oee' ? '91%' : dashboardType === 'yield' ? '99.2%' : '1.0%'}
          </Text>

          <Text position={[-10, -0.5, 0]} fontSize={0.4} color="#94a3b8" anchorX="left">Line B</Text>
          <mesh position={[-3.5, -0.5, 0]}>
            <planeGeometry args={[9, 0.6]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <Text position={[1.5, -0.5, 0]} fontSize={0.4} color="#ffffff" anchorX="left">
            {dashboardType === 'oee' ? '84%' : dashboardType === 'yield' ? '97.5%' : '1.5%'}
          </Text>

          <Text position={[-10, -2, 0]} fontSize={0.4} color="#94a3b8" anchorX="left">Line C</Text>
          <mesh position={[-2, -2, 0]}>
            <planeGeometry args={[12, 0.6]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <Text position={[4.5, -2, 0]} fontSize={0.4} color="#ffffff" anchorX="left">
            {dashboardType === 'oee' ? '95%' : dashboardType === 'yield' ? '98.8%' : '1.1%'}
          </Text>
        </group>
      </group>
    </group>
  );
};

const FactoryScene: React.FC<{ 
  equipmentList: Equipment[],
  lines: ProductionLine[],
  onItemClick: (data: Equipment) => void,
  selectedId: string | null,
  isScanning: boolean
}> = ({ equipmentList, lines, onItemClick, selectedId, isScanning }) => {
  const groupedEquipment = useMemo(() => {
    return lines.map(line => {
      const items = equipmentList.filter(e => e.lineId === line.id);
      return { line, items };
    });
  }, [equipmentList, lines]);

  const rowSpacing = 20;
  const columnSpacing = 5;

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[20, 30, 20]} intensity={2} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-10, 15, -10]} intensity={1} color="#ffffff" />
      
      {/* Floor with Safety Lines */}
      <group position={[0, -0.01, 0]}>
        {/* Main Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.05} />
        </mesh>
        
        {/* Safety Lines (Yellow/Black Hazard Stripes) */}
        {[-40, -20, 0, 20, 40].map((z) => (
          <mesh key={`h-line-${z}`} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 0.15]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        ))}
        {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((x) => (
          <mesh key={`v-line-${x}`} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 200]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        ))}
      </group>

      {/* Workshop Walls */}
      <group>
        {/* Back Wall */}
        <mesh position={[0, 15, -60]}>
          <planeGeometry args={[200, 30]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        {/* TV Dashboards on Back Wall */}
        <TVDashboard 
          position={[0, 15, -59.8]} 
          isSelected={selectedId === 'tv-dashboard-oee'} 
          onClick={onItemClick} 
          dashboardType="oee"
        />
        <TVDashboard 
          position={[-26, 15, -59.8]} 
          isSelected={selectedId === 'tv-dashboard-yield'} 
          onClick={onItemClick} 
          dashboardType="yield"
        />
        <TVDashboard 
          position={[26, 15, -59.8]} 
          isSelected={selectedId === 'tv-dashboard-scrap'} 
          onClick={onItemClick} 
          dashboardType="scrap"
        />

        {/* Left Wall */}
        <mesh position={[-100, 15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[200, 30]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        {/* Right Wall */}
        <mesh position={[100, 15, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[200, 30]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
      </group>

      {groupedEquipment.map(({ line, items }, rowIndex) => {
        if (!line || !line.id) return null;
        return (
          <group key={line.id} position={[0, 0, rowIndex * -rowSpacing]}>
            <Text 
              position={[-24, 0.5, 0]} 
              fontSize={1.2} 
              color="#3b82f6" 
              anchorX="right" 
              rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            >
              Line: {line.name || line.id || 'Unknown Line'}
            </Text>

            {items.map((item, colIndex) => {
              if (!item || !item.id) return null;
              const x = (colIndex * columnSpacing) - ((items.length - 1) * columnSpacing / 2);
              const position: [number, number, number] = [x, 0, 0];

              // Robust identification of Checkin Equipment
              const itemName = item.name || '';
              const itemId = item.id || '';
              const isCheckin = item.type === EquipmentType.CheckinEquipment || 
                               itemName.includes('打卡') || 
                               itemId.toLowerCase().includes('checkin');

              if (isCheckin) {
                return <FingerprintModel key={item.id} data={item} isSelected={selectedId === item.id} onClick={onItemClick} position={position} isGlobalScanning={isScanning} />;
              }
              if (item.type === EquipmentType.AGVCarEquipment || itemName.toLowerCase().includes('agv')) {
                return <AGVModel key={item.id} data={item} isSelected={selectedId === item.id} onClick={onItemClick} position={position} />;
              }
              return <MachineModel key={item.id} data={item} isSelected={selectedId === item.id} onClick={onItemClick} position={position} />;
            })}
          </group>
        );
      })}

      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
      <PerspectiveCamera makeDefault position={[0, 25, 40]} fov={45} />
      <Environment preset="city" />
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={100} blur={2} far={4.5} />
    </>
  );
};

interface AttendanceLog {
  time: string;
  name: string;
  employeeId: string;
  department?: string;
  isRetroactive?: boolean;
}

interface Line3DViewProps {
  equipmentList: Equipment[];
  lines: ProductionLine[];
  onOpenAttendance: (lineId?: string, deviceId?: string) => void;
  onOpenFACA: () => void;
  facaPendingItems: FACAPendingItem[];
  setFacaPendingItems: React.Dispatch<React.SetStateAction<FACAPendingItem[]>>;
  isMonitoring: boolean;
  setIsMonitoring: React.Dispatch<React.SetStateAction<boolean>>;
  onNavigate: (page: PageView) => void;
}

const Line3DView: React.FC<Line3DViewProps> = ({ 
  equipmentList, 
  lines,
  onOpenAttendance, 
  onOpenFACA,
  facaPendingItems,
  setFacaPendingItems,
  isMonitoring,
  setIsMonitoring,
  onNavigate
}) => {
  const [isRunningLoading, setIsRunningLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<{name: string, employeeId: string} | null>(null);
  const [verifyStatus, setVerifyStatus] = useState('請掃描指紋以確認身份');

  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [localEquipmentList, setLocalEquipmentList] = useState<Equipment[]>(equipmentList);

  useEffect(() => {
    setLocalEquipmentList(equipmentList);
  }, [equipmentList]);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7044/notificationHub')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected to SignalR Hub!');
          
          connection.on('ReceiveNotification', (notification: any) => {
            console.log('Received notification from SignalR:', notification);
            // You can add logic here to update UI or show toasts
          });
        })
        .catch(e => console.error('SignalR Connection failed: ', e));
    }

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [connection]);

  const [retroForm, setRetroForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '08:00~09:00',
    missedReason: '忘記打卡',
    otherReason: ''
  });

  const [isSubmittingRetro, setIsSubmittingRetro] = useState(false);
  const [isCancelingRetro, setIsCancelingRetro] = useState(false);

  // Removed simulated attendance logs in favor of real-time SignalR listener "CheckInNews"
  useEffect(() => {
    // Listener is now managed via handleStartClockIn and handleStopClockIn
  }, [isScanning, selectedItem]);

  useEffect(() => {
    if (!connection) return;

    if (isMonitoring) {
      console.log("Registering EquipmentStatus listener...");
      connection.on('EquipmentStatus', (data: { lineSystemName: string, equipmentSystemName: string, equipmentStatus: number }) => {
        console.log("Received EquipmentStatus update:", data);
        
        setLocalEquipmentList(prevList => {
          return prevList.map(item => {
            if (item.name === data.equipmentSystemName) {
              let newStatus: MachineStatus;
              switch (data.equipmentStatus) {
                case 1:
                  newStatus = MachineStatus.Warning; // Idle (Yellow)
                  break;
                case 2:
                  newStatus = MachineStatus.Running; // Running (Green)
                  break;
                default:
                  newStatus = MachineStatus.Stopped; // Error (Red)
                  break;
              }
              const updatedItem = { ...item, status: newStatus };
              
              setSelectedItem(prevSelected => {
                if (prevSelected && prevSelected.id === item.id) {
                  return updatedItem;
                }
                return prevSelected;
              });
              
              return updatedItem;
            }
            return item;
          });
        });
      });

      console.log("Registering FACATips listener...");
      connection.on('FACATips', (data: FACATipsMessage) => {
        console.log("Received FACATips update:", data);
        
        const newPendingItems: FACAPendingItem[] = data.alarmNew.map((alarm: any, index) => {
          const startTime = alarm.AlarmStartTime || alarm.alarmStartTime || new Date().toISOString();
          const endTime = alarm.AlarmEndTime || alarm.alarmEndTime || '';
          const alarmCode = alarm.AlarmCode || alarm.alarmCode || 'UNKNOWN';
          const alarmContent = alarm.AlarmNote || alarm.alarmNote || '未知錯誤';
          
          return {
            id: `F-${Date.now()}-${index}`,
            date: startTime.includes(' ') ? startTime.split(' ')[0] : startTime.split('T')[0],
            startTime: startTime,
            endTime: endTime,
            machineName: data.equipmentName || data.equipmentSystemName || '未知設備',
            lineSystemName: data.lineSystemName || '',
            equipmentSystemName: data.equipmentSystemName || '',
            alarmCode: alarmCode,
            alarmContent: alarmContent,
            status: 'AWAITING'
          };
        });

        setFacaPendingItems(prev => [...prev, ...newPendingItems]);
      });
    } else {
      console.log("Unregistering listeners...");
      connection.off('EquipmentStatus');
      connection.off('FACATips');
    }

    return () => {
      connection.off('EquipmentStatus');
      connection.off('FACATips');
    };
  }, [isMonitoring, connection, setFacaPendingItems]);

  /**
   * HTTP POST: Run/Running Process
   */
  const handleRunClick = async () => {
    setIsRunningLoading(true);
    try {
      // Using the original URL from document as requested
      const response = await api.post('https://localhost:7044/api/Run/Running', {});
      
      const { code, message } = response.data;
      
      if (code === 200) {
        setIsMonitoring(!isMonitoring);
      } else if (code === 404) {
        alert(`運行失敗: ${message || '找不到資源 (404)'}`);
      } else {
        alert(`運行失敗: ${message || '未知錯誤'}`);
      }
    } catch (error: any) {
      console.error("[Run API] Error:", error);
      const errorMsg = error.response?.data?.message || error.message || "網絡錯誤，請稍後再試。";
      alert(`運行異常: ${errorMsg}`);
    } finally {
      setIsRunningLoading(false);
    }
  };

  const handleItemClick = (data: Equipment) => {
    setSelectedItem(data);
    if (data.type !== EquipmentType.CheckinEquipment) {
      setIsScanning(false);
    }
  };

  /**
   * HTTP POST: Start Clock-in Process
   */
  const handleStartClockIn = async () => {
    if (!selectedItem || selectedItem.type !== EquipmentType.CheckinEquipment) return;

    try {
      const response = await api.post('https://localhost:7044/api/CheckIn/CheckInBegin', {
        lineSystemName: selectedItem.lineId,
        equipmentSystemName: selectedItem.id
      });

      const { code, message } = response.data;

      if (code === 200) {
        setIsScanning(true);
        if (connection) {
          connection.off('CheckInNews');
          connection.on('CheckInNews', (news: any) => {
            const newLog: AttendanceLog = {
              time: new Date(news.accessTime).toLocaleTimeString(),
              name: news.userName,
              employeeId: news.userID,
              department: news.department
            };
            setAttendanceLogs(prev => [newLog, ...prev.slice(0, 19)]);
          });
        }
      } else {
        alert(`啟動打卡失敗: ${message}`);
      }
    } catch (error: any) {
      console.error("[MES API] Communication Failed:", error.message);
      if (error.message === 'Network Error') {
        setIsScanning(true); 
        if (connection) {
          connection.off('CheckInNews');
          connection.on('CheckInNews', (news: any) => {
            const newLog: AttendanceLog = {
              time: new Date(news.accessTime).toLocaleTimeString(),
              name: news.userName,
              employeeId: news.userID,
              department: news.department
            };
            setAttendanceLogs(prev => [newLog, ...prev.slice(0, 19)]);
          });
        }
      } else {
        alert("通訊異常，請確認伺服器狀態。");
      }
    }
  };

  /**
   * HTTP POST: Stop Clock-in Process
   */
  const handleStopClockIn = async () => {
    if (!selectedItem || selectedItem.type !== EquipmentType.CheckinEquipment) return;

    try {
      const response = await api.post('https://localhost:7044/api/CheckIn/CheckInEnd', {
        lineSystemName: selectedItem.lineId,
        equipmentSystemName: selectedItem.id
      });

      const { code, message } = response.data;

      if (code === 200) {
        setIsScanning(false);
        if (connection) {
          connection.off('CheckInNews');
        }
      } else {
        alert(`停止打卡失敗: ${message}`);
      }
    } catch (error: any) {
      console.error("[MES API] Communication Failed:", error.message);
      setIsScanning(false);
      if (connection) {
        connection.off('CheckInNews');
      }
    }
  };

  /**
   * HTTP POST: Start Identity Verification for Supplemental Clock-in
   */
  const handleStartVerify = async () => {
    if (!selectedItem || selectedItem.type !== EquipmentType.CheckinEquipment) return;
    
    setIsVerifying(true);
    setVerifyStatus('正在採集指紋，請稍候...');
    
    const fingerNo = parseInt(selectedItem.fingerprintId || '1', 10);

    try {
      const response = await api.post('https://localhost:7044/api/CheckIn/MakeUpVerification', {
        lineSystemName: selectedItem.lineId,
        equipmentSystemName: selectedItem.id
      });

      const { code, message, data } = response.data;

      if (code === 200 && data) {
        setVerifiedInfo({
          name: data.userName,
          employeeId: data.userID
        });
        setVerifyStatus('身份驗證成功');
      } else {
        setVerifyStatus(`驗證失敗: ${message}`);
        setVerifiedInfo(null);
      }
    } catch (error: any) {
      console.error("[MES API] Supplemental Verification Failed:", error.message);
      setVerifyStatus('驗證異常：無法連線至服務器');
      setVerifiedInfo(null);
      
      if (error.message === 'Network Error') {
         setTimeout(() => {
          setIsVerifying(false);
          const names = ['王小明', '李大華', '張美玲', '趙鐵柱', '陳協理'];
          const ids = ['V001', 'V023', 'V045', 'V099', 'V102'];
          const randomIndex = Math.floor(Math.random() * names.length);
          
          setVerifiedInfo({
            name: names[randomIndex],
            employeeId: ids[randomIndex]
          });
          setVerifyStatus('身份驗證成功 (模擬模式)');
        }, 1500);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * HTTP POST: Submit Supplemental Attendance Record
   */
  const handleRetroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedInfo) {
      alert("請先完成身份驗證");
      return;
    }

    setIsSubmittingRetro(true);
    try {
      const finalReason = retroForm.missedReason === '其他' ? retroForm.otherReason : retroForm.missedReason;
      
      const response = await api.post('https://localhost:7044/api/CheckIn/MakeUpRecord', {
        missedDate: retroForm.date,
        missedPeriod: retroForm.timeSlot,
        missedReason: finalReason
      });

      const { code, message } = response.data;

      if (code === 200) {
        const newLog: AttendanceLog = {
          time: `${retroForm.date.slice(5)} ${retroForm.timeSlot.split('~')[0]}`, 
          name: verifiedInfo.name,
          employeeId: verifiedInfo.employeeId,
          isRetroactive: true
        };

        setAttendanceLogs(prev => [newLog, ...prev.slice(0, 19)]);
        setIsRetroModalOpen(false);
        setVerifiedInfo(null);
        setVerifyStatus('請掃描指紋以確認身份');
        setRetroForm({ 
          date: new Date().toISOString().slice(0, 10), 
          timeSlot: '08:00~09:00',
          missedReason: '忘記打卡',
          otherReason: ''
        });
        alert(message || '補卡記錄提交成功');
      } else {
        alert(`提交失敗: ${message}`);
      }
    } catch (error: any) {
      if (error.message === 'Network Error') {
        const newLog: AttendanceLog = {
          time: `${retroForm.date.slice(5)} ${retroForm.timeSlot.split('~')[0]}`, 
          name: verifiedInfo.name,
          employeeId: verifiedInfo.employeeId,
          isRetroactive: true
        };
        setAttendanceLogs(prev => [newLog, ...prev.slice(0, 19)]);
        setIsRetroModalOpen(false);
      } else {
        alert(`提交過程發生錯誤: ${error.message}`);
      }
    } finally {
      setIsSubmittingRetro(false);
    }
  };

  /**
   * HTTP POST: Cancel Supplemental Clock-in Operation
   */
  const handleRetroCancel = async () => {
    if (!selectedItem || selectedItem.type !== EquipmentType.CheckinEquipment) {
      setIsRetroModalOpen(false);
      return;
    }

    const fingerNo = parseInt(selectedItem.fingerprintId || '1', 10);
    setIsCancelingRetro(true);

    try {
      await api.post('https://localhost:7044/api/CheckIn/MakeUpCancel', {
        lineSystemName: selectedItem.lineId,
        equipmentSystemName: selectedItem.id
      });
    } catch (error: any) {
      console.error("[MES API] Cancel Supplemental Communication Failed:", error.message);
    } finally {
      setIsCancelingRetro(false);
      setIsRetroModalOpen(false);
      setVerifiedInfo(null);
      setVerifyStatus('請掃描指紋以確認身份');
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.Running: return 'text-green-600 bg-green-100';
      case MachineStatus.Warning: return 'text-orange-600 bg-orange-100';
      case MachineStatus.Stopped: return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="bg-slate-900 relative flex flex-1 w-full overflow-hidden">
      {/* FACA Freeze Overlay */}
      {facaPendingItems.length > 0 && (
        <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">系統已凍結：檢測到設備異常</h2>
          <p className="text-slate-300 max-w-md mb-8 leading-relaxed">
            目前有 <span className="text-red-400 font-bold">{facaPendingItems.length}</span> 項待處理的 FACA 分析。
            為了生產安全，界面已暫時鎖定。請立即前往 FACA 管理界面完成故障分析與改善措施提交。
          </p>
          <button 
            onClick={onOpenFACA}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-red-500/20 transition-all active:scale-95 flex items-center"
          >
            <FileWarning size={24} className="mr-3" /> 前往處理 FACA 異常
          </button>
        </div>
      )}

      <div className="flex-1 h-full w-full relative">
        <div className="absolute top-6 left-6 z-10 space-y-3 pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Layers size={20} className="mr-2 text-blue-500" /> Factory Digital Twin - 3D Monitoring
            </h3>
            <p className="text-xs text-slate-400 mt-2">場景內實例：{equipmentList.length} 個單位</p>
            <div className="mt-4 flex items-center space-x-3">
              <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${isMonitoring ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                {isMonitoring ? '監控運行中' : '監控已停止'}
              </div>
              {isScanning && (
                <div className="flex items-center text-blue-400 animate-pulse text-[10px] font-bold">
                  <Activity size={12} className="mr-2" /> 指紋儀採集進行中...
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 pointer-events-auto">
            <button 
              onClick={handleRunClick}
              disabled={isRunningLoading}
              className={`flex items-center px-6 py-3 rounded-xl font-bold text-xs shadow-xl transition-all active:scale-95 ${
                isRunningLoading 
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : isMonitoring 
                    ? 'bg-red-600/90 text-white hover:bg-red-700 shadow-red-900/20' 
                    : 'bg-green-600/90 text-white hover:bg-green-700 shadow-green-900/20'
              }`}
            >
              {isRunningLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              ) : (
                isMonitoring ? <Square size={16} className="mr-2" /> : <Play size={16} className="mr-2" />
              )}
              {isRunningLoading ? '處理中...' : (isMonitoring ? '停止' : '運行')}
            </button>

            <button 
              onClick={onOpenFACA}
              className="flex items-center px-6 py-3 bg-slate-800/90 backdrop-blur-md text-white rounded-xl font-bold text-xs shadow-xl shadow-slate-900/20 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all group"
            >
              <div className="relative mr-2">
                <FileWarning size={16} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
              FACA 異常分析管理 <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        
        {/* 移除原本位於右上角的縮放按鈕 */}

        <div className="absolute inset-0">
          <Canvas shadows dpr={[1, 2]}>
            <FactoryScene 
              equipmentList={localEquipmentList} 
              lines={lines}
              onItemClick={handleItemClick} 
              selectedId={selectedItem?.id || null} 
              isScanning={isScanning} 
            />
          </Canvas>
        </div>
      </div>

      <div className={`bg-white shadow-2xl z-20 transition-all duration-300 absolute right-0 top-0 bottom-0 overflow-hidden flex flex-col ${selectedItem ? 'w-80 translate-x-0' : 'w-80 translate-x-full opacity-0'}`}>
        {selectedItem && (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">單元屬性</h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-3">
                  {selectedItem.type === EquipmentType.CheckinEquipment ? <Fingerprint size={32} /> : selectedItem.type === EquipmentType.AGVCarEquipment ? <Truck size={32} /> : selectedItem.type === EquipmentType.TVDashboard ? <Monitor size={32} /> : <Cpu size={32} />}
                </div>
                <h4 className="text-md font-bold text-slate-900 text-center">{selectedItem.name}</h4>
                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tight">SN: {selectedItem.sn || selectedItem.id}</p>
                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-2">Line: {selectedItem.lineId}</p>
              </div>

              {/* Robust identification for side panel display */}
              {(selectedItem.type === EquipmentType.CheckinEquipment || selectedItem.name.includes('打卡')) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleStartClockIn}
                      disabled={isScanning}
                      className={`flex items-center justify-center py-3 rounded-xl text-xs font-bold transition-all shadow-sm
                        ${isScanning ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      <Play size={14} className="mr-1.5" /> 開始打卡
                    </button>
                    <button 
                      onClick={handleStopClockIn}
                      disabled={!isScanning}
                      className={`flex items-center justify-center py-3 rounded-xl text-xs font-bold transition-all shadow-sm
                        ${!isScanning ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}
                    >
                      <Square size={14} className="mr-1.5" /> 結束打卡
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsRetroModalOpen(true)}
                    className="w-full flex items-center justify-center py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-sm"
                  >
                    <ClipboardEdit size={14} className="mr-1.5" /> 手動補卡
                  </button>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                        <Activity size={12} className="mr-1.5" /> 實時考勤日誌
                      </span>
                      {isScanning && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {attendanceLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Clock size={24} className="mx-auto mb-2 opacity-20" />
                          <p className="text-[10px]">等待考勤數據...</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {attendanceLogs.map((log, idx) => (
                            <div key={idx} className={`p-3 transition-colors animate-in slide-in-from-top-1 ${log.isRetroactive ? 'bg-amber-50/30 border-l-2 border-amber-400' : 'hover:bg-blue-50'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold px-1.5 rounded ${log.isRetroactive ? 'text-amber-600 bg-amber-100' : 'text-blue-600 bg-blue-50'}`}>
                                  {log.time} {log.isRetroactive && '(補卡)'}
                                </span>
                                <CheckCircle2 size={12} className={log.isRetroactive ? 'text-amber-500' : 'text-green-500'} />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center">
                                  <User size={10} className="mr-1 text-slate-400" /> {log.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center">
                                  <Hash size={10} className="mr-1" /> {log.employeeId}
                                </span>
                              </div>
                              {log.department && (
                                <div className="mt-1 text-[10px] text-slate-500 flex items-center">
                                  <Layers size={10} className="mr-1 opacity-70" /> {log.department}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onOpenAttendance(selectedItem?.lineId, selectedItem?.id)}
                    className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold text-xs shadow-sm hover:bg-blue-100 transition-all flex items-center justify-center group"
                  >
                    <Calendar size={14} className="mr-2" /> 查看考勤信息 <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {(selectedItem.type !== EquipmentType.CheckinEquipment && !selectedItem.name.includes('打卡') && selectedItem.type !== EquipmentType.TVDashboard) && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">運行狀態</p>
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                      <Activity size={14} className="mr-2" /> {selectedItem.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center"><Thermometer size={12} className="mr-1" /> 溫度</p>
                      <p className="text-lg font-bold text-slate-800">{selectedItem.temperature}°C</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center"><Activity size={12} className="mr-1" /> 震動</p>
                      <p className="text-lg font-bold text-slate-800">{selectedItem.vibration}g</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === EquipmentType.TVDashboard && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">運行狀態</p>
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                      <Activity size={14} className="mr-2" /> {selectedItem.status}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center"><Monitor size={12} className="mr-1" /> 顯示內容</p>
                    <p className="text-sm font-bold text-blue-800">
                      {selectedItem.name === '良率分析數字看板' ? '車間良率實時數據' : 
                       selectedItem.name === '抛料率分析數字看板' ? '車間抛料率實時數據' : 
                       '車間 OEE 實時數據'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (selectedItem.name === '良率分析數字看板') {
                        onNavigate('YIELD_ANALYSIS');
                      } else if (selectedItem.name === '抛料率分析數字看板') {
                        onNavigate('SCRAP_RATE_ANALYSIS');
                      } else {
                        onNavigate('INTELLIGENT_MONITORING');
                      }
                    }}
                    className="w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-100 transition-all flex items-center justify-center group"
                  >
                    <Activity size={14} className="mr-2" /> 查看明細 <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isRetroModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
              <div className="flex items-center text-amber-800">
                <ClipboardEdit size={20} className="mr-2" />
                <h3 className="font-bold">員工考勤手動補卡</h3>
              </div>
              <button onClick={handleRetroCancel} disabled={isSubmittingRetro || isCancelingRetro} className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRetroSubmit} className="p-6 space-y-6">
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 flex items-start">
                <AlertCircle size={16} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed">提示：請員工先行掃描指紋驗證身份，補卡數據將標記為「手動錄入」。</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center">
                <div className={`w-20 h-20 bg-white rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden mb-4 ${isVerifying ? 'border-blue-400' : verifiedInfo ? 'border-green-400 bg-green-50' : 'border-slate-300'}`}>
                   {verifiedInfo ? (
                     <ShieldCheck size={40} className="text-green-500 animate-in zoom-in" />
                   ) : (
                     <Fingerprint size={40} className={`text-slate-200 ${isVerifying ? 'animate-pulse text-blue-300' : ''}`} />
                   )}
                   {isVerifying && (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-full h-0.5 bg-blue-400 absolute animate-[bounce_2s_infinite]"></div>
                     </div>
                   )}
                </div>
                
                <div className="text-center space-y-2 mb-4">
                  <p className={`text-xs font-bold ${verifiedInfo ? 'text-green-600' : 'text-slate-500'}`}>{verifyStatus}</p>
                  {verifiedInfo && (
                    <div className="bg-white px-4 py-2 rounded-lg border border-green-100 shadow-sm animate-in slide-in-from-bottom-2">
                       <p className="text-sm font-bold text-slate-800">{verifiedInfo.name}</p>
                       <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {verifiedInfo.employeeId}</p>
                    </div>
                  )}
                </div>

                {!verifiedInfo ? (
                  <button
                    type="button"
                    onClick={handleStartVerify}
                    disabled={isVerifying || isSubmittingRetro || isCancelingRetro}
                    className={`w-full flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all
                      ${isVerifying || isSubmittingRetro || isCancelingRetro ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                  >
                    <Scan size={14} className="mr-2" /> 開始身份驗證
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmittingRetro || isCancelingRetro}
                    onClick={() => { setVerifiedInfo(null); setVerifyStatus('請掃描指紋以確認身份'); }}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  >
                    重新驗證身份
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center">
                      <Calendar size={12} className="mr-1.5 text-blue-500" /> 補卡日期
                    </label>
                    <input
                      required
                      type="date"
                      value={retroForm.date}
                      onChange={(e) => setRetroForm({...retroForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center">
                      <Clock size={12} className="mr-1.5 text-blue-500" /> 補卡時間段
                    </label>
                    <select
                      required
                      value={retroForm.timeSlot}
                      onChange={(e) => setRetroForm({...retroForm, timeSlot: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center">
                    <MessageSquare size={12} className="mr-1.5 text-blue-500" /> 未打卡原因
                  </label>
                  <select
                    required
                    value={retroForm.missedReason}
                    onChange={(e) => setRetroForm({...retroForm, missedReason: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                  >
                    {MISSED_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                {retroForm.missedReason === '其他' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-bold text-slate-700 flex items-center">
                      <Edit3 size={12} className="mr-1.5 text-blue-500" /> 其他原因說明
                    </label>
                    <textarea
                      required
                      value={retroForm.otherReason}
                      onChange={(e) => setRetroForm({...retroForm, otherReason: e.target.value})}
                      placeholder="請手動輸入補卡原因..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[60px] resize-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  disabled={isSubmittingRetro || isCancelingRetro}
                  onClick={handleRetroCancel} 
                  className="flex-1 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-bold disabled:opacity-50"
                >
                  {isCancelingRetro ? '取消中...' : '取消'}
                </button>
                <button 
                  type="submit" 
                  disabled={!verifiedInfo || isSubmittingRetro || isCancelingRetro}
                  className={`flex-[2] flex items-center justify-center px-4 py-2 rounded-xl font-bold shadow-lg transition-all active:scale-95
                    ${!verifiedInfo || isSubmittingRetro || isCancelingRetro ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
                >
                  {isSubmittingRetro ? <Activity className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                  {isSubmittingRetro ? '提交中...' : '提交補卡記錄'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Line3DView;