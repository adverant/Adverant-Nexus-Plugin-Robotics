# RoboticsAI - Technical Documentation

## API Reference

### Base URL

```
https://api.adverant.ai/proxy/nexus-robotics/api/v1/robotics
```

### Authentication

All API requests require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

#### Required Scopes

| Scope | Description |
|-------|-------------|
| `robotics:read` | Read fleet and telemetry data |
| `robotics:control` | Send commands to robots |
| `robotics:tasks` | Manage task assignments |
| `robotics:maintenance` | Access maintenance features |

---

## API Endpoints

### Fleet Management

#### Get Fleet Status

```http
GET /fleet
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `site_id` | string | Filter by site |
| `status` | string | Filter by status |
| `type` | string | Filter by robot type |

**Response:**

```json
{
  "fleet": [
    {
      "robot_id": "rob_abc123",
      "name": "Delivery-Bot-1",
      "model": "UR10e",
      "manufacturer": "universal_robots",
      "type": "service",
      "status": "active",
      "current_task": {
        "task_id": "task_xyz",
        "type": "delivery",
        "progress": 75,
        "destination": "Room 405"
      },
      "location": {
        "floor": 4,
        "zone": "east_wing",
        "coordinates": { "x": 150.5, "y": 85.2 }
      },
      "battery": {
        "level": 82,
        "estimated_runtime_minutes": 180,
        "charging": false
      },
      "health": {
        "overall": "good",
        "score": 95,
        "alerts": []
      },
      "last_activity": "2025-01-15T10:25:00Z"
    }
  ],
  "summary": {
    "total_robots": 15,
    "active": 12,
    "idle": 2,
    "charging": 1,
    "maintenance": 0,
    "offline": 0
  },
  "sites": [
    { "site_id": "site_001", "name": "Grand Hotel", "robots": 15 }
  ]
}
```

#### Register Robot

```http
POST /robots
```

**Request Body:**

```json
{
  "name": "Delivery-Bot-1",
  "manufacturer": "universal_robots | abb | fanuc | kuka | yaskawa | custom",
  "model": "UR10e",
  "type": "service | industrial | collaborative | mobile",
  "connection": {
    "protocol": "modbus_tcp | ethernet_ip | opc_ua | ros2 | custom",
    "ip_address": "192.168.1.100",
    "port": 502
  },
  "site_id": "site_001",
  "capabilities": ["navigation", "arm", "gripper", "sensors"],
  "configuration": {
    "max_speed": 1.5,
    "max_payload_kg": 10,
    "safety_zones": ["lobby", "elevators"],
    "charging_station": "station_01"
  }
}
```

**Response:**

```json
{
  "robot_id": "rob_abc123",
  "name": "Delivery-Bot-1",
  "status": "connected",
  "capabilities": ["navigation", "arm", "gripper", "sensors"],
  "firmware_version": "5.12.0",
  "calibration_status": "required",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### Get Robot Status

```http
GET /robots/:id/status
```

**Response:**

```json
{
  "robot_id": "rob_abc123",
  "name": "Delivery-Bot-1",
  "connection_status": "connected",
  "operational_status": "active",
  "mode": "autonomous | manual | maintenance",
  "current_task": {
    "task_id": "task_xyz",
    "type": "delivery",
    "description": "Deliver package to Room 405",
    "progress": 75,
    "started_at": "2025-01-15T10:20:00Z",
    "estimated_completion": "2025-01-15T10:30:00Z"
  },
  "position": {
    "x": 150.5,
    "y": 85.2,
    "z": 0,
    "orientation": 45.0,
    "floor": 4,
    "zone": "east_wing"
  },
  "battery": {
    "level": 82,
    "voltage": 48.2,
    "current": 2.5,
    "temperature": 35,
    "estimated_runtime_minutes": 180,
    "health": "good"
  },
  "sensors": {
    "lidar": { "status": "active", "range": 10.0 },
    "camera_front": { "status": "active", "resolution": "1080p" },
    "camera_rear": { "status": "active", "resolution": "720p" },
    "ultrasonic": { "status": "active", "count": 4 }
  },
  "arm": {
    "status": "idle",
    "position": { "j1": 0, "j2": -90, "j3": 90, "j4": 0, "j5": 0, "j6": 0 },
    "payload_kg": 0,
    "gripper_status": "open"
  },
  "errors": [],
  "warnings": [
    { "code": "W001", "message": "Routine maintenance due in 5 days" }
  ],
  "uptime_hours": 156.5,
  "last_update": "2025-01-15T10:25:00Z"
}
```

### Task Management

#### Assign Task to Robot

```http
POST /tasks
```

**Request Body:**

```json
{
  "robot_id": "rob_abc123",
  "type": "delivery | patrol | pickup | cleaning | custom",
  "priority": "high | medium | low",
  "payload": {
    "destination": {
      "floor": 4,
      "zone": "east_wing",
      "location": "Room 405"
    },
    "items": [
      { "name": "Package", "weight_kg": 2.5 }
    ],
    "special_instructions": "Leave at door if no answer"
  },
  "schedule": {
    "start_time": "2025-01-15T10:30:00Z",
    "deadline": "2025-01-15T11:00:00Z"
  },
  "constraints": {
    "avoid_zones": ["pool_area"],
    "max_speed": 1.0,
    "elevator_required": true
  }
}
```

**Response:**

```json
{
  "task_id": "task_xyz789",
  "robot_id": "rob_abc123",
  "status": "assigned",
  "type": "delivery",
  "estimated_duration_minutes": 8,
  "route": {
    "distance_meters": 120,
    "waypoints": 5,
    "elevator_trips": 1
  },
  "created_at": "2025-01-15T10:25:00Z"
}
```

#### Get Task Status

```http
GET /tasks/:id
```

**Response:**

```json
{
  "task_id": "task_xyz789",
  "robot_id": "rob_abc123",
  "status": "in_progress",
  "type": "delivery",
  "progress": 65,
  "current_step": "Traveling to floor 4",
  "timeline": [
    { "step": "Task assigned", "timestamp": "2025-01-15T10:25:00Z" },
    { "step": "Navigation started", "timestamp": "2025-01-15T10:26:00Z" },
    { "step": "Elevator called", "timestamp": "2025-01-15T10:28:00Z" },
    { "step": "Arrived floor 4", "timestamp": "2025-01-15T10:30:00Z" }
  ],
  "estimated_completion": "2025-01-15T10:35:00Z",
  "route_remaining": {
    "distance_meters": 25,
    "waypoints": 2
  }
}
```

### Navigation & Path Planning

#### Plan Navigation Path

```http
POST /navigation/plan
```

**Request Body:**

```json
{
  "robot_id": "rob_abc123",
  "from": {
    "floor": 1,
    "zone": "lobby",
    "coordinates": { "x": 10, "y": 20 }
  },
  "to": {
    "floor": 4,
    "zone": "east_wing",
    "location": "Room 405"
  },
  "constraints": {
    "max_velocity": 1.0,
    "avoid_zones": ["pool_area", "kitchen"],
    "prefer_elevator": "elevator_a",
    "time_window": {
      "start": "2025-01-15T10:30:00Z",
      "end": "2025-01-15T11:00:00Z"
    }
  },
  "optimization": "shortest | fastest | safest"
}
```

**Response:**

```json
{
  "plan_id": "plan_abc123",
  "robot_id": "rob_abc123",
  "status": "computed",
  "route": {
    "total_distance_meters": 125.5,
    "estimated_duration_seconds": 480,
    "segments": [
      {
        "segment_id": 1,
        "type": "navigation",
        "from": { "x": 10, "y": 20, "floor": 1 },
        "to": { "x": 50, "y": 30, "floor": 1 },
        "distance_meters": 42.5,
        "duration_seconds": 120
      },
      {
        "segment_id": 2,
        "type": "elevator",
        "elevator_id": "elevator_a",
        "from_floor": 1,
        "to_floor": 4,
        "duration_seconds": 60
      },
      {
        "segment_id": 3,
        "type": "navigation",
        "from": { "x": 50, "y": 30, "floor": 4 },
        "to": { "x": 150, "y": 85, "floor": 4 },
        "distance_meters": 83.0,
        "duration_seconds": 300
      }
    ],
    "waypoints": [
      { "x": 10, "y": 20, "floor": 1, "action": "start" },
      { "x": 50, "y": 30, "floor": 1, "action": "elevator_enter" },
      { "x": 50, "y": 30, "floor": 4, "action": "elevator_exit" },
      { "x": 100, "y": 60, "floor": 4, "action": "checkpoint" },
      { "x": 150, "y": 85, "floor": 4, "action": "destination" }
    ]
  },
  "collision_avoidance": {
    "enabled": true,
    "detected_obstacles": 0,
    "other_robots_in_path": []
  },
  "alternatives": [
    {
      "optimization": "shortest",
      "distance_meters": 110.0,
      "duration_seconds": 520
    }
  ],
  "computed_at": "2025-01-15T10:25:00Z"
}
```

### Telemetry

#### Get Robot Telemetry

```http
GET /telemetry/:robotId
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `metrics` | string[] | Specific metrics to include |
| `from` | string | Start timestamp |
| `to` | string | End timestamp |
| `interval` | string | Data interval (1s, 1m, 5m, 1h) |

**Response:**

```json
{
  "robot_id": "rob_abc123",
  "period": {
    "from": "2025-01-15T09:00:00Z",
    "to": "2025-01-15T10:00:00Z"
  },
  "current": {
    "battery_level": 82,
    "speed": 0.8,
    "cpu_usage": 45,
    "memory_usage": 62,
    "temperature": 38,
    "motor_temps": [35, 36, 34, 37, 35, 36]
  },
  "time_series": {
    "battery": [
      { "timestamp": "2025-01-15T09:00:00Z", "value": 95 },
      { "timestamp": "2025-01-15T09:30:00Z", "value": 88 },
      { "timestamp": "2025-01-15T10:00:00Z", "value": 82 }
    ],
    "speed": [
      { "timestamp": "2025-01-15T09:00:00Z", "value": 0 },
      { "timestamp": "2025-01-15T09:30:00Z", "value": 1.2 },
      { "timestamp": "2025-01-15T10:00:00Z", "value": 0.8 }
    ]
  },
  "statistics": {
    "distance_traveled_meters": 450,
    "tasks_completed": 5,
    "average_speed": 0.95,
    "idle_time_minutes": 15,
    "errors_count": 0
  }
}
```

### Maintenance

#### Get Maintenance Predictions

```http
GET /maintenance/predictions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `robot_id` | string | Filter by robot |
| `horizon_days` | number | Prediction horizon |

**Response:**

```json
{
  "predictions": [
    {
      "robot_id": "rob_abc123",
      "robot_name": "Delivery-Bot-1",
      "predictions": [
        {
          "component": "drive_motor_left",
          "predicted_failure_date": "2025-02-10",
          "confidence": 0.85,
          "current_health": 78,
          "indicators": [
            "Increased vibration frequency",
            "Temperature trending higher",
            "Current draw increased 12%"
          ],
          "recommended_action": "Schedule motor replacement",
          "estimated_downtime_hours": 4,
          "part_number": "UR-MOT-001",
          "estimated_cost": 450
        },
        {
          "component": "battery",
          "predicted_failure_date": "2025-03-15",
          "confidence": 0.72,
          "current_health": 82,
          "indicators": [
            "Capacity degradation detected",
            "Charge cycles: 450/500"
          ],
          "recommended_action": "Plan battery replacement",
          "estimated_downtime_hours": 2,
          "part_number": "UR-BAT-48V",
          "estimated_cost": 800
        }
      ]
    }
  ],
  "summary": {
    "robots_analyzed": 15,
    "components_at_risk": 3,
    "scheduled_maintenance_hours": 8,
    "estimated_total_cost": 1650
  },
  "generated_at": "2025-01-15T10:00:00Z"
}
```

#### Schedule Maintenance

```http
POST /maintenance/schedule
```

**Request Body:**

```json
{
  "robot_id": "rob_abc123",
  "type": "preventive | corrective | inspection",
  "components": ["drive_motor_left"],
  "scheduled_date": "2025-02-05",
  "scheduled_time": "09:00",
  "estimated_duration_hours": 4,
  "technician_notes": "Replace left drive motor per predictive maintenance alert",
  "parts_required": [
    { "part_number": "UR-MOT-001", "quantity": 1 }
  ]
}
```

**Response:**

```json
{
  "maintenance_id": "maint_abc123",
  "robot_id": "rob_abc123",
  "status": "scheduled",
  "type": "preventive",
  "scheduled": "2025-02-05T09:00:00Z",
  "estimated_duration_hours": 4,
  "robot_taken_offline": false,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## Rate Limits

| Tier | Fleet/min | Tasks/min | Telemetry/min |
|------|-----------|-----------|---------------|
| Starter | 30 | 50 | 100 |
| Professional | 100 | 200 | 500 |
| Enterprise | 500 | 1000 | Unlimited |

---

## Data Models

### Robot

```typescript
interface Robot {
  robot_id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: 'service' | 'industrial' | 'collaborative' | 'mobile';
  status: 'active' | 'idle' | 'charging' | 'maintenance' | 'offline' | 'error';
  connection: ConnectionInfo;
  site_id: string;
  capabilities: string[];
  configuration: RobotConfiguration;
  position?: Position;
  battery?: BatteryStatus;
  health: HealthStatus;
  current_task?: TaskReference;
  created_at: string;
  updated_at: string;
}

interface ConnectionInfo {
  protocol: 'modbus_tcp' | 'ethernet_ip' | 'opc_ua' | 'ros2' | 'custom';
  ip_address: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  latency_ms?: number;
}

interface Position {
  x: number;
  y: number;
  z?: number;
  orientation: number;
  floor: number;
  zone: string;
  timestamp: string;
}

interface BatteryStatus {
  level: number;
  voltage: number;
  current: number;
  temperature: number;
  charging: boolean;
  estimated_runtime_minutes: number;
  health: 'good' | 'degraded' | 'replace';
}

interface HealthStatus {
  overall: 'good' | 'warning' | 'critical';
  score: number;
  components: ComponentHealth[];
  alerts: Alert[];
}
```

### Task

```typescript
interface Task {
  task_id: string;
  robot_id: string;
  type: 'delivery' | 'patrol' | 'pickup' | 'cleaning' | 'custom';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  payload: TaskPayload;
  schedule?: TaskSchedule;
  constraints?: TaskConstraints;
  route?: RouteInfo;
  timeline: TaskEvent[];
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface TaskPayload {
  destination: Location;
  items?: Item[];
  special_instructions?: string;
  custom_data?: Record<string, unknown>;
}

interface RouteInfo {
  total_distance_meters: number;
  estimated_duration_seconds: number;
  segments: RouteSegment[];
  waypoints: Waypoint[];
}
```

---

## SDK Integration

### JavaScript/TypeScript

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

const client = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY
});

// Get fleet status
const fleet = await client.robotics.fleet();
console.log(`${fleet.summary.active} robots active`);

// Register a robot
const robot = await client.robotics.robots.create({
  name: 'Delivery-Bot-2',
  manufacturer: 'universal_robots',
  model: 'UR10e',
  connection: {
    protocol: 'modbus_tcp',
    ip_address: '192.168.1.101',
    port: 502
  }
});

// Assign a task
const task = await client.robotics.tasks.create({
  robot_id: robot.robot_id,
  type: 'delivery',
  priority: 'high',
  payload: {
    destination: {
      floor: 4,
      zone: 'east_wing',
      location: 'Room 405'
    }
  }
});

// Plan navigation
const plan = await client.robotics.navigation.plan({
  robot_id: robot.robot_id,
  to: { floor: 4, zone: 'east_wing', location: 'Room 405' },
  optimization: 'fastest'
});

console.log(`Route: ${plan.route.total_distance_meters}m, ${plan.route.estimated_duration_seconds}s`);

// Get maintenance predictions
const maintenance = await client.robotics.maintenance.predictions({
  horizon_days: 30
});
```

### Python

```python
from nexus_sdk import NexusClient

client = NexusClient(api_key=os.environ["NEXUS_API_KEY"])

# Get fleet status
fleet = client.robotics.fleet()
print(f"Active robots: {fleet['summary']['active']}")

for robot in fleet["fleet"]:
    print(f"  {robot['name']}: {robot['status']} (battery: {robot['battery']['level']}%)")

# Assign delivery task
task = client.robotics.tasks.create(
    robot_id="rob_abc123",
    type="delivery",
    priority="high",
    payload={
        "destination": {
            "floor": 4,
            "zone": "east_wing",
            "location": "Room 405"
        },
        "items": [{"name": "Package", "weight_kg": 2.5}]
    }
)

# Monitor task progress
while task["status"] not in ["completed", "failed"]:
    task = client.robotics.tasks.get(task["task_id"])
    print(f"Progress: {task['progress']}%")
    time.sleep(5)

# Get telemetry
telemetry = client.robotics.telemetry(
    robot_id="rob_abc123",
    metrics=["battery", "speed", "temperature"]
)
```

---

## Webhook Events

| Event | Description |
|-------|-------------|
| `robot.connected` | Robot connected to system |
| `robot.disconnected` | Robot connection lost |
| `robot.error` | Robot error detected |
| `task.assigned` | Task assigned to robot |
| `task.started` | Task execution started |
| `task.completed` | Task completed successfully |
| `task.failed` | Task failed |
| `battery.low` | Battery below threshold |
| `maintenance.due` | Maintenance prediction alert |
| `collision.detected` | Collision or near-miss |

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ROBOT_NOT_FOUND` | 404 | Robot does not exist |
| `ROBOT_OFFLINE` | 400 | Robot not connected |
| `ROBOT_BUSY` | 400 | Robot executing another task |
| `TASK_NOT_FOUND` | 404 | Task does not exist |
| `PATH_NOT_FOUND` | 400 | No valid path to destination |
| `COLLISION_RISK` | 400 | Path blocked or collision risk |
| `ROBOT_LIMIT_EXCEEDED` | 402 | Robot limit for tier exceeded |

---

## Deployment Requirements

### Container Specifications

| Resource | Value |
|----------|-------|
| CPU | 1000m (1 core) |
| Memory | 2048 MB |
| Disk | 5 GB |
| Timeout | 60,000 ms (1 min) |
| Max Concurrent Jobs | 50 |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis for real-time data |
| `MAGEAGENT_URL` | Yes | MageAgent for predictions |
| `MQTT_BROKER` | Yes | MQTT for robot communication |

### Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/health` | General health check |
| `/ready` | Readiness probe |
| `/live` | Liveness probe |

---

## Supported Robots

| Manufacturer | Models | Protocol |
|--------------|--------|----------|
| Universal Robots | UR3e, UR5e, UR10e, UR16e, UR20 | Modbus TCP, RTDE |
| ABB | IRB series | OPC-UA, EGM |
| FANUC | CRX, LR Mate, M-series | FANUC ROBOGUIDE |
| KUKA | LBR iiwa, KR series | EtherNet/IP, KRL |
| Yaskawa | GP series, HC series | MotoPlus |
| Custom | Any | ROS 2, Modbus |

---

## Quotas and Limits

### By Pricing Tier

| Limit | Starter | Professional | Enterprise |
|-------|---------|--------------|------------|
| Robots | 5 | 25 | Unlimited |
| Tasks/day | 100 | 1,000 | Unlimited |
| Telemetry Retention | 7 days | 30 days | 1 year |
| Path Planning | Basic | Advanced | Custom |
| Predictive Maintenance | Alerts | Full | Custom Models |
| Multi-Robot Coordination | - | Yes | Yes |
| Edge Deployment | - | - | Yes |

### Pricing

| Tier | Monthly |
|------|---------|
| Starter | $99 |
| Professional | $299 |
| Enterprise | Custom |

---

## Support

- **Documentation**: [docs.adverant.ai/plugins/robotics](https://docs.adverant.ai/plugins/robotics)
- **Discord**: [discord.gg/adverant](https://discord.gg/adverant)
- **Email**: support@adverant.ai
- **GitHub Issues**: [Report a bug](https://github.com/adverant/Adverant-Nexus-Plugin-Robotics/issues)
