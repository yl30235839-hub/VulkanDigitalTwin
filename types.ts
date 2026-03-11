
export enum MachineStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Warning = 'WARNING',
  Maintenance = 'MAINTENANCE'
}

export enum LineType {
  NVIDIA = 'VKLine_NVIDIA',
  APPLE = 'VKLine_APPLE'
}

export enum EquipmentType {
  AssemblyEquipment = '組裝設備',
  AGVCarEquipment = 'AGV小車',
  CheckinEquipment = '打卡設備',
  TestingEquipment = '檢測設備',
  WaterVaporEquipment = '水氣防設備'
}

export interface Factory {
  id: string;
  name: string;
  location: string;
  manager: string;
  totalLines: number;
  efficiency: number;
}

export interface ProductionLine {
  id: string;
  factoryId: string;
  name: string;
  description?: string;
  category?: string;
  lineType?: LineType;
  status: MachineStatus;
  outputPerHour: number;
  targetOutput: number;
}

export interface Equipment {
  id: string;
  lineId: string;
  name: string;
  type: EquipmentType;
  description?: string;
  status: MachineStatus;
  temperature: number;
  vibration: number;
  lastMaintenance: string;
  equipmentSN?: string;
  // Specialized fields for Clock-in Device
  factoryArea?: string;
  floor?: string;
  sn?: string;
  fingerprintId?: string;
  // Communication fields for Assembly Equipment
  alarmAddress?: string;
  alarmAddressLength?: number;
  okCountAddress?: string;
  ngCountAddress?: string;
  rejectCountAddress?: string;
  statusAddress?: string;
  alarmEndAddress?: string;
}

export interface Personnel {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  techLevel: string;
  hasFingerprint1: boolean;
  hasFingerprint2: boolean;
  extraPermissions: {
    keyPersonnel: boolean;
    mobilePersonnel: boolean;
  };
}

export interface UserData {
  Site: string;
  Floor: string;
  Product: string;
  Line: string;
  Process: string;
  UserName: string;
  UserID: string;
  UserPassword?: string;
  Department: string;
  UserJobName: string;
  UserLevel: string;
  KeyPersonnel: boolean;
  MobilePersonnel: boolean;
  HostSoftware: boolean;
  EquipmentOp: boolean;
  ComparisonResults?: string;
  Permissions: string;
  FingerprintInfoA?: any;
  FingerprintInfoB?: any;
  CanBeRecorded?: boolean;
  FingerExist?: boolean;
}

export type PageView = 'LOGIN' | 'REGISTER' | 'LINES' | 'EQUIPMENT' | '3D_VIEW' | 'DEVICE_SETTINGS' | 'ATTENDANCE_MAINTENANCE' | 'FACA_MANAGEMENT';

export interface AlarmRecordModel {
  AlarmCode: string;
  AlarmNote: string;
  AlarmSolution: string;
  AlarmStartTime: string;
  AlarmEndTime: string;
  AlarmDuration: number;
  Maintenance: number;
  MachineNO: string;
}

export interface FACATipsMessage {
  lineSystemName: string;
  equipmentSystemName: string;
  alarmNew: AlarmRecordModel[];
}

export interface FACAPendingItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  machineName: string;
  alarmCode: string;
  alarmContent: string;
  status: 'AWAITING' | 'ANALYZING' | 'COMPLETED';
}
