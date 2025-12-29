// ==================== SERVICE PORTS ====================

export const SERVICE_PORTS = {
  // NexusRobotics ports
  ROBOTICS_HTTP: parseInt(process.env.ROBOTICS_HTTP_PORT || '9113', 10),
  ROBOTICS_WS: parseInt(process.env.ROBOTICS_WS_PORT || '9114', 10),

  // Integration with existing Nexus services
  VIDEO_AGENT: parseInt(process.env.VIDEO_AGENT_PORT || '9200', 10),
  GEO_AGENT: parseInt(process.env.GEO_AGENT_PORT || '9103', 10),
  GEO_AGENT_ML: parseInt(process.env.GEO_AGENT_ML_PORT || '9108', 10),
  MAGE_AGENT: parseInt(process.env.MAGE_AGENT_PORT || '9080', 10),
  ORCHESTRATION: parseInt(process.env.ORCHESTRATION_PORT || '9109', 10),
  GRAPHRAG: parseInt(process.env.GRAPHRAG_PORT || '9090', 10),
  GATEWAY: parseInt(process.env.GATEWAY_PORT || '9092', 10),
  SPECTRUM_AGENT: parseInt(process.env.SPECTRUM_AGENT_PORT || '9115', 10),
} as const;

// ==================== SERVICE URLS ====================

export const SERVICE_URLS = {
  VIDEO_AGENT: process.env.VIDEO_AGENT_URL || `http://videoagent-api:${SERVICE_PORTS.VIDEO_AGENT}`,
  GEO_AGENT: process.env.GEO_AGENT_URL || `http://nexus-geoagent-api:${SERVICE_PORTS.GEO_AGENT}`,
  GEO_AGENT_ML: process.env.GEO_AGENT_ML_URL || `http://nexus-geoagent-ml:${SERVICE_PORTS.GEO_AGENT_ML}`,
  MAGE_AGENT: process.env.MAGE_AGENT_URL || `http://nexus-mageagent:${SERVICE_PORTS.MAGE_AGENT}`,
  ORCHESTRATION: process.env.ORCHESTRATION_URL || `http://nexus-orchestrationagent:${SERVICE_PORTS.ORCHESTRATION}`,
  GRAPHRAG: process.env.GRAPHRAG_URL || `http://nexus-graphrag:${SERVICE_PORTS.GRAPHRAG}`,
  GATEWAY: process.env.GATEWAY_URL || `http://nexus-gateway:${SERVICE_PORTS.GATEWAY}`,
  SPECTRUM_AGENT: process.env.SPECTRUM_AGENT_URL || `http://nexus-spectrum-agent:${SERVICE_PORTS.SPECTRUM_AGENT}`,
} as const;

// ==================== DATABASE CONFIG ====================

export const DATABASE_CONFIG = {
  HOST: process.env.POSTGRES_HOST || 'localhost',
  PORT: parseInt(process.env.POSTGRES_PORT || '9432', 10),
  DATABASE: process.env.POSTGRES_DB || 'nexus_robotics',
  USER: process.env.POSTGRES_USER || 'postgres',
  PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
  MAX_CONNECTIONS: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
  IDLE_TIMEOUT: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000', 10),
} as const;

// ==================== REDIS CONFIG ====================

export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '9379', 10),
  PASSWORD: process.env.REDIS_PASSWORD,
  DB: parseInt(process.env.REDIS_DB || '0', 10),
} as const;

// ==================== PERFORMANCE THRESHOLDS ====================

export const PERFORMANCE_THRESHOLDS = {
  // Latency targets (milliseconds)
  SENSOR_FUSION_LATENCY: 100,
  OBJECT_DETECTION_LATENCY: 100,
  OBJECT_CLASSIFICATION_LATENCY: 5000,
  PATH_PLANNING_LOCAL_LATENCY: 50,
  PATH_PLANNING_GLOBAL_LATENCY: 5000,
  TELEMETRY_UPLOAD_LATENCY: 1000,

  // Accuracy targets
  OBJECT_DETECTION_ACCURACY: 0.95,
  OBJECT_CLASSIFICATION_ACCURACY: 0.95,
  POSITION_GPS_ACCURACY: 5, // meters
  POSITION_GPS_DENIED_ACCURACY: 50, // meters

  // Update rates (Hz)
  SENSOR_FUSION_RATE: 20,
  NAVIGATION_UPDATE_RATE: 20,
  TELEMETRY_RATE: 10,

  // System reliability
  TARGET_AVAILABILITY: 0.999, // 99.9%
} as const;

// ==================== NAVIGATION CONSTANTS ====================

export const NAVIGATION_CONSTANTS = {
  // Path planning
  RRT_STAR_MAX_ITERATIONS: 1000,
  RRT_STAR_STEP_SIZE: 10, // meters
  RRT_STAR_GOAL_THRESHOLD: 5, // meters
  A_STAR_GRID_RESOLUTION: 1, // meters
  DWA_TIME_HORIZON: 3, // seconds
  DWA_TIME_RESOLUTION: 0.1, // seconds

  // Obstacle avoidance
  SAFETY_MARGIN: 5, // meters
  COLLISION_CHECK_RESOLUTION: 0.5, // meters

  // GPS-denied navigation
  VISUAL_ODOMETRY_MIN_FEATURES: 50,
  INS_DRIFT_THRESHOLD: 100, // meters
  TERRAIN_MATCHING_CORRELATION_THRESHOLD: 0.8,
} as const;

// ==================== OBJECT DETECTION CONSTANTS ====================

export const OBJECT_DETECTION_CONSTANTS = {
  // Detection
  MIN_DETECTION_CONFIDENCE: 0.7,
  MAX_TRACKING_DISTANCE: 1000, // meters
  TRACK_LOST_TIMEOUT: 5000, // milliseconds

  // Classification
  MIN_CLASSIFICATION_CONFIDENCE: 0.90,
  SAFETY_DISTANCE_PERSON: 5, // meters from people
  SAFETY_DISTANCE_VEHICLE: 10, // meters from vehicles
} as const;

// ==================== FLEET CONSTANTS ====================

export const FLEET_CONSTANTS = {
  // Coordination
  MAX_FLEET_SIZE: 100,
  CONSENSUS_TIMEOUT: 5000, // milliseconds
  TASK_ALLOCATION_TIMEOUT: 3000, // milliseconds

  // Communication
  MESH_NETWORK_RANGE: 10000, // meters
  PEER_UPDATE_INTERVAL: 1000, // milliseconds
  HEARTBEAT_INTERVAL: 500, // milliseconds
  MEMBER_TIMEOUT: 5000, // milliseconds

  // Formation
  FORMATION_SPACING_MIN: 10, // meters
  FORMATION_SPACING_MAX: 100, // meters
  FORMATION_TOLERANCE: 5, // meters
} as const;

// ==================== CONNECTIVITY CONSTANTS ====================

export const CONNECTIVITY_CONSTANTS = {
  // Connection
  TARGET_LATENCY: 100, // milliseconds
  MIN_BANDWIDTH: 1_000_000, // 1 Mbps
  OPTIMAL_BANDWIDTH: 10_000_000, // 10 Mbps

  // Health monitoring
  HEALTH_CHECK_INTERVAL: 5000, // milliseconds
  CONNECTION_RETRY_INTERVAL: 10000, // milliseconds
  MAX_RETRY_ATTEMPTS: 5,

  // Data sync
  TELEMETRY_UPLOAD_INTERVAL: 1000, // milliseconds
  MISSION_UPDATE_CHECK_INTERVAL: 5000, // milliseconds
} as const;

// ==================== LOGGING LEVELS ====================

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
} as const;

// ==================== API CONSTANTS ====================

export const API_CONSTANTS = {
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  LONG_RUNNING_TIMEOUT: 300000, // 5 minutes

  // Retry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// ==================== MISSION STATUS MACHINE ====================

export const MISSION_STATUS_TRANSITIONS = {
  PLANNING: ['READY', 'ABORTED'],
  READY: ['IN_PROGRESS', 'ABORTED'],
  IN_PROGRESS: ['PAUSED', 'COMPLETED', 'FAILED', 'ABORTED'],
  PAUSED: ['IN_PROGRESS', 'ABORTED'],
  COMPLETED: [],
  FAILED: [],
  ABORTED: [],
} as const;

// ==================== PLATFORM DEFAULTS ====================

export const PLATFORM_DEFAULTS = {
  DRONE_QUADCOPTER: {
    maxSpeed: 20, // m/s
    maxAltitude: 120, // meters (typical FAA limit)
    maxRange: 10, // kilometers
    endurance: 1800, // 30 minutes
    turnRadius: 1, // meters
    maneuverability: 'VERY_HIGH' as const,
  },
  DRONE_FIXED_WING: {
    maxSpeed: 30, // m/s
    maxAltitude: 400, // meters
    maxRange: 50, // kilometers
    endurance: 7200, // 2 hours
    turnRadius: 50, // meters
    maneuverability: 'MEDIUM' as const,
  },
  GROUND_VEHICLE: {
    maxSpeed: 15, // m/s
    maxRange: 100, // kilometers
    endurance: 14400, // 4 hours
    turnRadius: 5, // meters
    maneuverability: 'LOW' as const,
  },
} as const;

// ==================== FEATURE FLAGS ====================

export const FEATURE_FLAGS = {
  ENABLE_GPS_DENIED_NAV: process.env.ENABLE_GPS_DENIED_NAV !== 'false',
  ENABLE_FLEET_COORDINATION: process.env.ENABLE_FLEET_COORDINATION !== 'false',
  ENABLE_TELEMETRY_UPLOAD: process.env.ENABLE_TELEMETRY_UPLOAD !== 'false',
  ENABLE_MISSION_LEARNING: process.env.ENABLE_MISSION_LEARNING !== 'false',
  ENABLE_SAFETY_MONITORING: process.env.ENABLE_SAFETY_MONITORING !== 'false',
} as const;

// ==================== ENVIRONMENT ====================

export const ENVIRONMENT = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// ==================== VERSION ====================

export const VERSION = '2.0.0'; // Civilian version
export const SERVICE_NAME = 'nexus-robotics';
