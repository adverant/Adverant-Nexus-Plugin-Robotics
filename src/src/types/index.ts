import { FeatureCollection } from 'geojson';

// ============================================================================
// CIVILIAN ROBOTICS TYPES - NON-ITAR, EXPORT-COMPLIANT
// ============================================================================
// This module contains types for civilian robotics applications only:
// - Delivery drones
// - Inspection robots
// - Agriculture automation
// - Search & rescue
// - Environmental monitoring
// - Infrastructure inspection
// NO military, weapons, or ITAR-controlled applications
// ============================================================================

// ==================== PLATFORM TYPES ====================

export enum PlatformType {
  DRONE_QUADCOPTER = 'DRONE_QUADCOPTER',
  DRONE_FIXED_WING = 'DRONE_FIXED_WING',
  GROUND_VEHICLE = 'GROUND_VEHICLE',
  GROUND_ROVER = 'GROUND_ROVER',
  NAVAL_USV = 'NAVAL_USV', // Research, monitoring
  NAVAL_UUV = 'NAVAL_UUV', // Underwater inspection
  AERIAL_BLIMP = 'AERIAL_BLIMP',
  LEGGED_ROBOT = 'LEGGED_ROBOT',
  WHEELED_ROBOT = 'WHEELED_ROBOT',
}

export interface Platform {
  id: string;
  type: PlatformType;
  name: string;
  capabilities: PlatformCapabilities;
  constraints: PlatformConstraints;
  sensors: SensorConfiguration[];
  actuators: ActuatorConfiguration[];
  communicationLinks: CommunicationLink[];
}

export interface PlatformCapabilities {
  maxSpeed: number; // m/s
  maxAltitude?: number; // meters (for aerial platforms)
  maxDepth?: number; // meters (for underwater platforms)
  maxRange: number; // kilometers
  payloadCapacity: number; // kilograms
  endurance: number; // seconds
  maneuverability: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  batteryCapacity?: number; // Wh
  chargingTime?: number; // seconds
}

export interface PlatformConstraints {
  minSpeed: number; // m/s
  minAltitude?: number; // meters
  turnRadius: number; // meters
  maxAcceleration: number; // m/s²
  maxClimbRate?: number; // m/s (for aerial)
  restrictedZones?: FeatureCollection; // No-fly zones, private property
  operationalLimits: {
    maxGForce?: number;
    maxWindSpeed?: number; // m/s
    minVisibility?: number; // meters
    temperatureRange?: [number, number]; // Celsius
    maxHumidity?: number; // percentage
  };
}

// ==================== SENSOR TYPES ====================

export enum SensorType {
  CAMERA_RGB = 'CAMERA_RGB',
  CAMERA_THERMAL = 'CAMERA_THERMAL',
  CAMERA_MULTISPECTRAL = 'CAMERA_MULTISPECTRAL',
  LIDAR = 'LIDAR',
  RADAR = 'RADAR',
  ULTRASONIC = 'ULTRASONIC',
  GPS = 'GPS',
  IMU = 'IMU',
  MAGNETOMETER = 'MAGNETOMETER',
  BAROMETER = 'BAROMETER',
  PROXIMITY = 'PROXIMITY',
  GAS_SENSOR = 'GAS_SENSOR',
  MOISTURE_SENSOR = 'MOISTURE_SENSOR',
  TEMPERATURE_SENSOR = 'TEMPERATURE_SENSOR',
}

export interface SensorConfiguration {
  id: string;
  type: SensorType;
  name: string;
  updateRate: number; // Hz
  accuracy: number;
  range: number; // meters
  fov?: number;
  resolution?: [number, number];
  enabled: boolean;
}

export interface SensorData {
  sensorId: string;
  type: SensorType;
  timestamp: number;
  data: any;
  quality: number; // 0-1
}

// ==================== NAVIGATION TYPES ====================

export interface Position3D {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: number;
}

export interface Velocity3D {
  vx: number; // m/s
  vy: number;
  vz: number;
  speed: number;
  heading: number; // degrees
}

export interface Waypoint {
  id: string;
  position: Position3D;
  action?: 'HOVER' | 'LAND' | 'TAKEOFF' | 'INSPECT' | 'COLLECT_SAMPLE' | 'DELIVER' | 'SCAN' | 'CHARGE';
  arrivalRadius: number;
  loiterTime?: number;
  speed?: number;
}

export interface Path {
  id: string;
  waypoints: Waypoint[];
  totalDistance: number;
  estimatedDuration: number;
  createdAt: number;
  algorithm: 'RRT_STAR' | 'A_STAR' | 'HYBRID' | 'DWA';
}

export interface Obstacle {
  id: string;
  position: Position3D;
  velocity?: Velocity3D;
  shape: 'SPHERE' | 'CYLINDER' | 'BOX' | 'POLYGON';
  dimensions: number[];
  confidence: number;
  type: 'STATIC' | 'DYNAMIC';
  classification?: string; // 'person', 'vehicle', 'building', etc.
}

// ==================== OBJECT DETECTION ====================

/**
 * Detection result from VideoAgent object detection
 */
export interface Detection {
  id?: string;
  category: string;
  label: string;
  confidence: number;
  bbox?: [number, number, number, number]; // [x, y, width, height]
  attributes?: Record<string, any>;
}

/**
 * Camera data for video processing
 */
export interface CameraData {
  frameId: string;
  timestamp: number;
  imageUrl?: string;
  imageBuffer?: Buffer;
  resolution: [number, number];
  metadata?: {
    exposure?: number;
    iso?: number;
    focalLength?: number;
    cameraId?: string;
  };
}

export enum ObjectClassification {
  UNKNOWN = 'UNKNOWN',
  PERSON = 'PERSON',
  VEHICLE = 'VEHICLE',
  BICYCLE = 'BICYCLE',
  ANIMAL = 'ANIMAL',
  BUILDING = 'BUILDING',
  TREE = 'TREE',
  SIGN = 'SIGN',
  TRAFFIC_LIGHT = 'TRAFFIC_LIGHT',
  PACKAGE = 'PACKAGE',
  EQUIPMENT = 'EQUIPMENT',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
}

export interface TrackedObject {
  id: string;
  position: Position3D;
  velocity?: Velocity3D;
  classification: ObjectClassification;
  confidence: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  firstDetected: number;
  lastSeen: number;
  trackingHistory: Position3D[];
  metadata: {
    type?: string;
    description?: string;
  };
}

// ==================== TARGET CLASSIFICATION (AI) ====================

/**
 * Target classification categories for AI analysis
 */
export enum TargetClassification {
  UNKNOWN = 'UNKNOWN',
  PERSON = 'PERSON',
  VEHICLE_GROUND = 'VEHICLE_GROUND',
  VEHICLE_AIR = 'VEHICLE_AIR',
  VEHICLE_WATER = 'VEHICLE_WATER',
  ANIMAL = 'ANIMAL',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  NATURAL_FEATURE = 'NATURAL_FEATURE',
  EQUIPMENT = 'EQUIPMENT',
  PACKAGE = 'PACKAGE',
  HAZARD = 'HAZARD',
}

/**
 * Target for AI-powered classification and tracking
 */
export interface Target {
  id: string;
  classification: TargetClassification;
  position: Position3D;
  velocity?: Velocity3D;
  features: {
    visual?: any;
    thermal?: any;
    rf?: any;
  };
  trackingHistory: Position3D[];
  confidence?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

// ==================== RF/SPECTRUM TYPES ====================

/**
 * RF signal data from spectrum analysis
 */
export interface RFData {
  id: string;
  frequency: number; // Hz
  bandwidth: number; // Hz
  power: number; // dBm
  modulation?: string;
  timestamp: number;
  location?: Position3D;
  signature?: string;
  classification?: string;
}

/**
 * EW threat type classifications
 */
export enum EWThreatType {
  UNKNOWN = 'UNKNOWN',
  GPS_JAMMING = 'GPS_JAMMING',
  GPS_SPOOFING = 'GPS_SPOOFING',
  COMMUNICATION_JAMMING = 'COMMUNICATION_JAMMING',
  RADAR_INTERFERENCE = 'RADAR_INTERFERENCE',
  DRONE_DETECTION = 'DRONE_DETECTION',
}

/**
 * Electronic warfare threat detection
 */
export interface EWThreat {
  id: string;
  type: EWThreatType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frequency?: number;
  power?: number;
  location?: Position3D;
  firstDetected: number;
  lastSeen: number;
  confidence: number;
  mitigationStatus?: 'NONE' | 'MONITORING' | 'MITIGATING' | 'RESOLVED';
}

// ==================== MISSION TYPES (CIVILIAN) ====================

export enum MissionType {
  DELIVERY = 'DELIVERY',
  INSPECTION = 'INSPECTION',
  SURVEILLANCE = 'SURVEILLANCE', // Security, wildlife
  MAPPING = 'MAPPING',
  SEARCH_AND_RESCUE = 'SEARCH_AND_RESCUE',
  AGRICULTURE = 'AGRICULTURE',
  ENVIRONMENTAL_MONITORING = 'ENVIRONMENTAL_MONITORING',
  INFRASTRUCTURE_MONITORING = 'INFRASTRUCTURE_MONITORING',
  CARGO_TRANSPORT = 'CARGO_TRANSPORT',
  PATROL = 'PATROL', // Security patrol
  DATA_COLLECTION = 'DATA_COLLECTION',
  EMERGENCY_RESPONSE = 'EMERGENCY_RESPONSE',
}

export enum MissionStatus {
  PLANNING = 'PLANNING',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
}

export enum MissionMode {
  MANUAL = 'MANUAL',
  SEMI_AUTONOMOUS = 'SEMI_AUTONOMOUS',
  AUTONOMOUS = 'AUTONOMOUS',
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  status: MissionStatus;
  mode: MissionMode;
  platformId: string;
  startTime: number;
  endTime?: number;
  estimatedDuration: number;
  objectives: MissionObjective[];
  path: Path;
  constraints: MissionConstraints;
  fleetConfig?: FleetConfiguration;
  connectivityRequired: boolean;
  metadata: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    customer?: string;
    project?: string;
    createdBy: string;
  };
}

export interface MissionObjective {
  id: string;
  type: 'PRIMARY' | 'SECONDARY' | 'OPTIONAL';
  description: string;
  location?: Position3D;
  radius?: number;
  completed: boolean;
  completedAt?: number;
  data?: any;
}

export interface MissionConstraints {
  maxAltitude?: number;
  minAltitude?: number;
  maxSpeed?: number;
  restrictedZones?: FeatureCollection;
  exclusionZones?: FeatureCollection;
  timeWindows?: Array<{ start: number; end: number }>;
  batteryReserve: number; // Percentage
  weatherLimits: {
    maxWindSpeed?: number;
    minVisibility?: number;
    maxPrecipitation?: number;
  };
  safetyDistance: number; // From people, vehicles
}

export interface MissionResult {
  missionId: string;
  status: MissionStatus;
  objectivesCompleted: number;
  objectivesTotal: number;
  duration: number;
  distanceTraveled: number;
  energyConsumed: number;
  dataCollected?: {
    images?: number;
    videos?: number;
    measurements?: number;
  };
  incidents?: Array<{
    timestamp: number;
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  lessons: string[];
  telemetry: any[];
}

// ==================== FLEET COORDINATION ====================

export interface FleetConfiguration {
  fleetId: string;
  coordinatorId?: string;
  memberIds: string[];
  formation?: 'LINE' | 'V' | 'DIAMOND' | 'CIRCLE' | 'GRID';
  spacing: number;
  coordinationMode: 'CENTRALIZED' | 'DISTRIBUTED' | 'HYBRID';
  taskAllocation: 'STATIC' | 'DYNAMIC' | 'AUCTION';
  communicationProtocol: 'WIFI' | 'CELLULAR' | '5G' | 'LORA' | 'MESH';
}

export interface FleetMember {
  id: string;
  platformId: string;
  role: 'COORDINATOR' | 'WORKER' | 'SCOUT' | 'BACKUP';
  position: Position3D;
  status: 'ACTIVE' | 'INACTIVE' | 'FAILED' | 'DISCONNECTED' | 'CHARGING';
  health: number;
  taskAssignment?: string;
  lastUpdate: number;
}

export interface FleetTask {
  id: string;
  type: string;
  priority: number;
  assignedTo?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

// ==================== COMMUNICATION ====================

export interface CommunicationLink {
  id: string;
  type: 'WIFI' | 'CELLULAR' | '5G' | 'LORA' | 'SATELLITE' | 'MESH';
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  bandwidth: number;
  latency: number;
  packetLoss: number;
  signalStrength: number;
  lastUpdate: number;
}

export interface TelemetryData {
  platformId: string;
  timestamp: number;
  position: Position3D;
  velocity: Velocity3D;
  attitude: [number, number, number];
  health: {
    battery: number;
    temperature: number;
    status: 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
    errors: string[];
  };
}

// ==================== ACTUATORS ====================

export interface ActuatorConfiguration {
  id: string;
  type: 'MOTOR' | 'SERVO' | 'GRIPPER' | 'SPRAYER' | 'GIMBAL' | 'CARGO_RELEASE' | 'SAMPLE_COLLECTOR';
  name: string;
  range?: [number, number];
  precision: number;
  responseTime: number;
  enabled: boolean;
}

// ==================== WORLD STATE ====================

export interface WorldState {
  timestamp: number;
  position: Position3D;
  velocity: Velocity3D;
  attitude: [number, number, number];
  obstacles: Obstacle[];
  trackedObjects: TrackedObject[];
  communication: CommunicationLink[];
  health: {
    battery: number;
    temperature: number;
    errors: string[];
  };
  environment: {
    windSpeed?: number;
    temperature?: number;
    humidity?: number;
    visibility?: number;
  };
}

// ==================== SAFETY ====================

export interface SafetyZone {
  id: string;
  type: 'KEEP_OUT' | 'RESTRICTED' | 'PRIVATE_PROPERTY';
  geometry: FeatureCollection;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  active: boolean;
}

export interface SafetyViolation {
  id: string;
  timestamp: number;
  type: 'ZONE_BREACH' | 'SPEED_LIMIT' | 'ALTITUDE_LIMIT' | 'PROXIMITY' | 'BATTERY_LOW';
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  description: string;
  location?: Position3D;
  actionTaken?: string;
}

// ==================== API TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId: string;
    processingTime?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== ERRORS ====================

export class RoboticsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'RoboticsError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NavigationError extends RoboticsError {
  constructor(message: string, details?: any) {
    super(message, 'NAVIGATION_ERROR', 500, details);
    this.name = 'NavigationError';
  }
}

export class SensorError extends RoboticsError {
  constructor(message: string, details?: any) {
    super(message, 'SENSOR_ERROR', 500, details);
    this.name = 'SensorError';
  }
}

export class MissionError extends RoboticsError {
  constructor(message: string, details?: any) {
    super(message, 'MISSION_ERROR', 500, details);
    this.name = 'MissionError';
  }
}

export class FleetError extends RoboticsError {
  constructor(message: string, details?: any) {
    super(message, 'FLEET_ERROR', 500, details);
    this.name = 'FleetError';
  }
}

export class SafetyError extends RoboticsError {
  constructor(message: string, details?: any) {
    super(message, 'SAFETY_ERROR', 500, details);
    this.name = 'SafetyError';
  }
}

export class CommunicationError extends RoboticsError {
  constructor(message: string, details?: any) {
    super(message, 'COMMUNICATION_ERROR', 500, details);
    this.name = 'CommunicationError';
  }
}
