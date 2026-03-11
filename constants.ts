import { Factory, ProductionLine, Equipment, MachineStatus, EquipmentType, LineType, Personnel } from './types';

export const INITIAL_PERSONNEL: Personnel[] = [
  { 
    id: 'p1', 
    name: '王大錘', 
    employeeId: 'V001', 
    department: '機構', 
    position: '工程師', 
    techLevel: '3級(Level A)', 
    hasFingerprint1: true,
    hasFingerprint2: true,
    extraPermissions: { keyPersonnel: true, mobilePersonnel: false } 
  },
  { 
    id: 'p2', 
    name: '李小美', 
    employeeId: 'V042', 
    department: '電控', 
    position: '高級工程師', 
    techLevel: '開發', 
    hasFingerprint1: true,
    hasFingerprint2: false,
    extraPermissions: { keyPersonnel: true, mobilePersonnel: true } 
  },
  { 
    id: 'p3', 
    name: '張三', 
    employeeId: 'V089', 
    department: '視覺', 
    position: '技術員', 
    techLevel: '2級(Level B)', 
    hasFingerprint1: false,
    hasFingerprint2: false,
    extraPermissions: { keyPersonnel: false, mobilePersonnel: true } 
  },
  { 
    id: 'p4', 
    name: '李四', 
    employeeId: 'V112', 
    department: '導入', 
    position: '實習生', 
    techLevel: '1級(Level C)', 
    hasFingerprint1: true,
    hasFingerprint2: true,
    extraPermissions: { keyPersonnel: false, mobilePersonnel: false } 
  },
];

export const MOCK_FACTORIES: Factory[] = [
  { id: 'F1', name: '台北總廠', location: '台北市', manager: '張經理', totalLines: 1, efficiency: 95 },
];

export const MOCK_LINES: ProductionLine[] = [];

export const MOCK_EQUIPMENT: Equipment[] = [];
