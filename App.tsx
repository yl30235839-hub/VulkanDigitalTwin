import React, { useState } from 'react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LineManagement from './components/LineManagement';
import EquipmentManagement from './components/EquipmentManagement';
import Line3DView from './components/Line3DView';
import DeviceSettings from './components/DeviceSettings';
import AttendanceMaintenance from './components/AttendanceMaintenance';
import FACAManagement from './components/FACAManagement';
import YieldAnalysis from './components/YieldAnalysis';
import IntelligentMonitoring from './components/IntelligentMonitoring';
import ScrapRateAnalysis from './components/ScrapRateAnalysis';
import { PageView, Equipment, ProductionLine, FACAPendingItem, Personnel, UserData } from './types';
import { MOCK_EQUIPMENT, MOCK_LINES, INITIAL_PERSONNEL } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('LINES');
  const [previousPage, setPreviousPage] = useState<PageView | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedLineData, setSelectedLineData] = useState<any>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  
  // Lifted State - Initially from constants
  const [factoryInfo, setFactoryInfo] = useState({ code: 'GL', floor: '3F' });
  const [allLines, setAllLines] = useState<ProductionLine[]>(MOCK_LINES);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [facaPendingItems, setFacaPendingItems] = useState<FACAPendingItem[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUsername(username);
    setCurrentPage(username === 'admin' ? 'LINES' : '3D_VIEW');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUsername('');
    setCurrentPage('LOGIN');
    setSelectedLineId(null);
    setSelectedDeviceId(null);
  };

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    if (page !== 'EQUIPMENT' && page !== 'DEVICE_SETTINGS' && page !== 'ATTENDANCE_MAINTENANCE' && page !== 'REGISTER' && page !== 'FACA_MANAGEMENT') {
      setSelectedLineId(null);
    }
  };

  const handleViewEquipment = (lineId: string, lineData?: any) => {
    setSelectedLineId(lineId);
    if (lineData) {
      setSelectedLineData(lineData);
    }
    setCurrentPage('EQUIPMENT');
  };

  const handleMaintainDevice = (deviceId: string, data?: any) => {
    if (data) {
      setAllEquipment(prev => prev.map(e => {
        if (e.id === deviceId) {
          return {
            ...e,
            name: data.equipmentName !== undefined && data.equipmentName !== null ? data.equipmentName : e.name,
            description: data.description !== undefined && data.description !== null ? data.description : e.description,
            equipmentSN: data.equipmentSN !== undefined && data.equipmentSN !== null ? data.equipmentSN : e.equipmentSN,
            fingerprintId: data.fingerIndex !== undefined && data.fingerIndex !== null ? data.fingerIndex.toString() : e.fingerprintId,
            ip: data.plcIP !== undefined && data.plcIP !== null ? data.plcIP : e.ip,
            plcBrand: data.plcBrand !== undefined && data.plcBrand !== null ? data.plcBrand : e.plcBrand,
            plcSeries: data.series !== undefined && data.series !== null ? data.series : e.plcSeries,
            plcPort: data.plcPort !== undefined && data.plcPort !== null ? data.plcPort.toString() : e.plcPort,
            plcStation: data.station !== undefined && data.station !== null ? data.station.toString() : e.plcStation,
            plcDataType: data.dataType !== undefined && data.dataType !== null ? data.dataType : e.plcDataType,
            plcStringReverse: data.isReverse !== undefined && data.isReverse !== null ? data.isReverse : e.plcStringReverse,
            alarmAddress: data.alarmAddress !== undefined && data.alarmAddress !== null ? data.alarmAddress : e.alarmAddress,
            alarmAddressLength: data.alarmAddressLength !== undefined && data.alarmAddressLength !== null ? data.alarmAddressLength : e.alarmAddressLength,
            okCountAddress: data.oKCapacityAdd !== undefined && data.oKCapacityAdd !== null ? data.oKCapacityAdd : e.okCountAddress,
            ngCountAddress: data.nGCapacityAdd !== undefined && data.nGCapacityAdd !== null ? data.nGCapacityAdd : e.ngCountAddress,
            rejectCountAddress: data.throwCapacityAdd !== undefined && data.throwCapacityAdd !== null ? data.throwCapacityAdd : e.rejectCountAddress,
            statusAddress: data.statusAdd !== undefined && data.statusAdd !== null ? data.statusAdd : e.statusAddress,
            alarmEndAddress: data.alarmEndSignAdd !== undefined && data.alarmEndSignAdd !== null ? data.alarmEndSignAdd : e.alarmEndAddress
          };
        }
        return e;
      }));
    }
    setSelectedDeviceId(deviceId);
    setCurrentPage('DEVICE_SETTINGS');
  }

  const handleUpdateEquipment = (updatedEquip: Equipment) => {
    setAllEquipment(prev => prev.map(e => e.id === updatedEquip.id ? updatedEquip : e));
  };

  const handleAddEquipment = (newEquip: Equipment) => {
    setAllEquipment(prev => [...prev, newEquip]);
  };

  const handleBackToEquipment = () => {
    setCurrentPage('EQUIPMENT');
    setSelectedDeviceId(null);
  }

  const handleGoToAttendance = (lineId?: string, deviceId?: string) => {
    if (lineId) setSelectedLineId(lineId);
    if (deviceId) setSelectedDeviceId(deviceId);
    setCurrentPage('ATTENDANCE_MAINTENANCE');
  };

  const handleGoToFACA = () => {
    setCurrentPage('FACA_MANAGEMENT');
  };

  const handleGoToRegister = (personnel?: Personnel) => {
    setPreviousPage(currentPage);
    setEditingPersonnel(personnel || null);
    setCurrentPage('REGISTER');
  };

  const handleRegisterSuccess = (users: UserData[]) => {
    if (Array.isArray(users)) {
      const mappedPersonnel: Personnel[] = users.map(user => ({
        id: user.UserID,
        name: user.UserName,
        employeeId: user.UserID,
        department: user.Department,
        position: user.UserJobName,
        techLevel: user.UserLevel,
        hasFingerprint1: !!(user.FingerprintInfoA && (Array.isArray(user.FingerprintInfoA) ? user.FingerprintInfoA.length > 0 : true)),
        hasFingerprint2: !!(user.FingerprintInfoB && (Array.isArray(user.FingerprintInfoB) ? user.FingerprintInfoB.length > 0 : true)),
        extraPermissions: {
          keyPersonnel: !!user.KeyPersonnel,
          mobilePersonnel: !!user.MobilePersonnel,
        }
      }));

      setPersonnelList(prev => {
        // Filter out existing users with same employeeId to avoid duplicates
        const filteredPrev = prev.filter(p => !mappedPersonnel.some(mp => mp.employeeId === p.employeeId));
        return [...filteredPrev, ...mappedPersonnel];
      });
    }
  };

  const handleUpdateFactory = (newLines: ProductionLine[], newEquipment: Equipment[], info?: { code: string, floor: string }) => {
    // Merge lines: keep existing lines, update/add new ones
    setAllLines(prev => {
      const otherLines = prev.filter(l => !newLines.some(nl => nl.id === l.id));
      return [...otherLines, ...newLines];
    });
    
    // Merge equipment: keep equipment from other lines, update/add equipment for the lines being updated
    setAllEquipment(prev => {
      const lineIds = newLines.map(l => l.id);
      const otherLinesEquip = prev.filter(e => !lineIds.includes(e.lineId));
      
      // Also ensure no duplicate IDs within the new equipment and existing equipment
      const newEquipIds = newEquipment.map(e => e.id);
      const filteredOtherEquip = otherLinesEquip.filter(e => !newEquipIds.includes(e.id));
      
      return [...filteredOtherEquip, ...newEquipment];
    });
    
    if (info) setFactoryInfo(info);
  };

  const handleResetFactory = () => {
    setAllLines([]);
    setAllEquipment([]);
    setFactoryInfo({ code: '', floor: '' });
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      if (currentPage === 'REGISTER') {
        return (
          <RegisterPage 
            onBack={() => setCurrentPage('LOGIN')} 
            onSuccess={handleRegisterSuccess}
            lineSystemName={selectedLineId || ''}
            equipmentSystemName={selectedDeviceId || ''}
          />
        );
      }
      return <LoginPage onLogin={handleLogin} onGoToRegister={() => setCurrentPage('REGISTER')} />;
    }

    switch (currentPage) {
      case 'LINES':
        return (
          <LineManagement 
            onViewEquipment={handleViewEquipment} 
            onUpdateFactory={handleUpdateFactory} 
            onResetFactory={handleResetFactory}
            lines={allLines}
            equipmentList={allEquipment}
            factoryInfo={factoryInfo}
            currentUsername={currentUsername}
          />
        );
      case 'EQUIPMENT':
        return (
          <EquipmentManagement 
            lineId={selectedLineId} 
            lineData={selectedLineData}
            equipmentList={allEquipment}
            onAddEquipment={handleAddEquipment}
            onMaintainDevice={handleMaintainDevice} 
          />
        );
      case 'DEVICE_SETTINGS':
        const device = allEquipment.find(e => e.id === selectedDeviceId) || null;
        return (
          <DeviceSettings 
            device={device} 
            onSave={handleUpdateEquipment}
            onBack={handleBackToEquipment} 
          />
        );
      case '3D_VIEW':
        return (
          <Line3DView 
            equipmentList={allEquipment}
            lines={allLines}
            onOpenAttendance={handleGoToAttendance} 
            onOpenFACA={handleGoToFACA} 
            facaPendingItems={facaPendingItems}
            setFacaPendingItems={setFacaPendingItems}
            isMonitoring={isMonitoring}
            setIsMonitoring={setIsMonitoring}
            onNavigate={handleNavigate}
          />
        );
      case 'ATTENDANCE_MAINTENANCE':
        return (
          <AttendanceMaintenance 
            lineId={selectedLineId}
            deviceId={selectedDeviceId}
            personnelList={personnelList}
            setPersonnelList={setPersonnelList}
            onBack={() => setCurrentPage('3D_VIEW')} 
            onGoToRegister={handleGoToRegister} 
          />
        );
      case 'FACA_MANAGEMENT':
        return (
          <FACAManagement 
            onBack={() => setCurrentPage('3D_VIEW')} 
            pendingItems={facaPendingItems}
            setPendingItems={setFacaPendingItems}
            currentUsername={currentUsername}
            personnelList={personnelList}
          />
        );
      case 'REGISTER':
        return (
          <RegisterPage 
            onBack={() => {
              setEditingPersonnel(null);
              setCurrentPage(previousPage || 'ATTENDANCE_MAINTENANCE');
            }} 
            onSuccess={handleRegisterSuccess}
            onSave={(data) => {
              setPersonnelList(prev => prev.map(p => 
                p.employeeId === data.employeeId 
                  ? { 
                      ...p, 
                      name: data.name, 
                      department: data.department,
                      position: data.position,
                      techLevel: data.techLevel,
                      extraPermissions: {
                        keyPersonnel: data.extraPermissions.keyPersonnel,
                        mobilePersonnel: data.extraPermissions.mobilePersonnel
                      }
                    } 
                  : p
              ));
              setEditingPersonnel(null);
              setCurrentPage(previousPage || 'ATTENDANCE_MAINTENANCE');
            }}
            isEdit={!!editingPersonnel}
            initialData={editingPersonnel}
            lineSystemName={selectedLineId || ''}
            equipmentSystemName={selectedDeviceId || ''}
          />
        );
      case 'YIELD_ANALYSIS':
        return <YieldAnalysis onBack={() => setCurrentPage('3D_VIEW')} />;
      case 'INTELLIGENT_MONITORING':
        return <IntelligentMonitoring onBack={() => setCurrentPage('3D_VIEW')} />;
      case 'SCRAP_RATE_ANALYSIS':
        return <ScrapRateAnalysis onBack={() => setCurrentPage('3D_VIEW')} />;
      default:
        return (
          <LineManagement 
            onViewEquipment={handleViewEquipment} 
            onUpdateFactory={handleUpdateFactory} 
            onResetFactory={handleResetFactory}
            lines={allLines}
            equipmentList={allEquipment}
            factoryInfo={factoryInfo}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      {!isAuthenticated ? (
        renderContent()
      ) : (
        <Layout 
          currentPage={currentPage} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          userName={currentUsername || "張經理"}
        >
          {renderContent()}
        </Layout>
      )}
    </div>
  );
};

export default App;