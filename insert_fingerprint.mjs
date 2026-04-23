import fs from 'fs';

let content = fs.readFileSync('components/Line3DView.tsx', 'utf8');

const fingerprintComponent = `
const FingerprintDevice: React.FC<{ 
  position: [number, number, number], 
  rotation?: [number, number, number],
  isSelected?: boolean,
  onClick?: (data: Equipment) => void
}> = ({ position, rotation = [0, 0, 0], isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const deviceData: Equipment = {
    id: 'fingerprint-attendance-1',
    lineId: 'GLOBAL',
    name: '指紋考勤設備',
    type: EquipmentType.CheckinEquipment,
    description: '車間人員考勤打卡設備',
    status: MachineStatus.Running,
    temperature: 24,
    vibration: 0,
    lastMaintenance: new Date().toISOString().split('T')[0],
    sn: 'ZKTeco-X1',
    factoryArea: 'GL',
    floor: '3F'
  };

  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={(e: any) => { e.stopPropagation(); onClick && onClick(deviceData); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Selection Highlight */}
      {isSelected && (
        <mesh position={[0, 0, 0.2]}>
          <planeGeometry args={[1.6, 3.6]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Main Body (Black) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.4, 3.4, 0.2]} />
        <meshStandardMaterial color={hovered ? "#333333" : "#111111"} roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Top White Strip */}
      <mesh position={[0, 1.5, 0.11]}>
        <planeGeometry args={[1.3, 0.2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Cameras */}
      <mesh position={[-0.2, 1.25, 0.11]}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      <mesh position={[0.2, 1.25, 0.11]}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      {/* LCD Screen */}
      <mesh position={[0, 0.2, 0.11]}>
        <planeGeometry args={[1.15, 1.7]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Screen Content - Time */}
      <Text position={[0, 0.5, 0.12]} fontSize={0.3} color="#111" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
        11:58
      </Text>
      <Text position={[0, 0.15, 0.12]} fontSize={0.08} color="#333" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
        2026-04-23 星期四
      </Text>
      <Text position={[0, -0.15, 0.12]} fontSize={0.12} color="#111" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
        歡迎
      </Text>
      
      {/* Fingerprint Scanner Area */}
      <mesh position={[0, -1.0, 0.11]}>
        <planeGeometry args={[0.5, 0.6]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      {/* Fingerprint Blue Light */}
      <mesh position={[0, -1.0, 0.12]}>
        <planeGeometry args={[0.4, 0.5]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
      </mesh>
      {/* Glowing Light effect */}
      <mesh position={[0, -1.0, 0.13]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
      </mesh>
      
      {/* Logo at bottom */}
      <Text position={[0, -1.5, 0.11]} fontSize={0.1} color="#4ade80" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
        ZKTeco
      </Text>
    </group>
  );
};
`;

content = content.replace(
  /const FactoryScene: React\.FC<\{/, 
  fingerprintComponent + '\nconst FactoryScene: React.FC<{'
);

const renderBlock = `        {/* Fingerprint Attendance Device on Back Wall */}
        <FingerprintDevice 
          position={[-40, 10, -59.8]} 
          isSelected={selectedId === 'fingerprint-attendance-1'} 
          onClick={onItemClick} 
        />
        
        <TVDashboard`;

content = content.replace(/        <TVDashboard/, renderBlock);

fs.writeFileSync('components/Line3DView.tsx', content);
console.log('Done!');
