# Quick Start: RoboticsAI - Autonomous Robot Fleet Management

> **Integration Time**: ~15 minutes | **First Result**: ~5 minutes after install

Get your robot fleet connected to Nexus and executing AI-optimized motion plans in minutes. This guide walks you through installation, verification, and your first autonomous operation.

---

## Prerequisites

Before you begin, ensure you have:

- **Nexus Account**: Free signup at [adverant.ai](https://adverant.ai)
- **API Key**: Generate from the Nexus Dashboard under Settings > API Keys
- **Node.js 18+** or **Python 3.9+** for SDK usage
- **Network Access**: Robots must be reachable from the Nexus edge connector

### Supported Robot Manufacturers

| Manufacturer | Protocol | Tested Models |
|--------------|----------|---------------|
| Universal Robots | Modbus TCP, RTDE | UR3e, UR5e, UR10e, UR16e, UR20 |
| ABB | OPC-UA, EGM | IRB series |
| FANUC | ROBOGUIDE | CRX, LR Mate, M-series |
| KUKA | EtherNet/IP, KRL | LBR iiwa, KR series |
| Yaskawa | MotoPlus | GP series, HC series |
| Custom | ROS 2, Modbus | Any compatible robot |

---

## Installation (30 seconds)

### Via Nexus CLI (Recommended)

```bash
# Install the plugin from Nexus Marketplace
nexus plugin install nexus-robotics

# Verify installation
nexus plugin list | grep robotics
```

### Via REST API

```bash
curl -X POST "https://api.adverant.ai/plugins/nexus-robotics/install" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "pluginId": "nexus-robotics",
  "version": "1.0.0",
  "status": "installed",
  "endpoints": {
    "basePath": "/api/v1/robotics"
  }
}
```

---

## Verify Installation (60 seconds)

Confirm the plugin is running and ready to accept connections.

### Health Check

```bash
curl "https://api.adverant.ai/proxy/nexus-robotics/health" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "motionPlanner": "ready",
    "sensorFusion": "ready",
    "maintenancePredictor": "ready"
  },
  "uptime": "2h 34m"
}
```

### Readiness Check

```bash
curl "https://api.adverant.ai/proxy/nexus-robotics/ready" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Your First Operation (3-5 minutes)

### Step 1: Register Your Robot

Connect your first robot to the Nexus fleet management system.

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-robotics/api/v1/fleet" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assembly-Robot-1",
    "manufacturer": "universal_robots",
    "model": "UR10e",
    "ipAddress": "192.168.1.100",
    "protocol": "modbus_tcp",
    "location": {
      "zone": "assembly-line-1",
      "position": { "x": 0, "y": 0, "z": 0 }
    }
  }'
```

**Response:**
```json
{
  "robotId": "rob_7f8a9b2c",
  "status": "connected",
  "capabilities": ["motion", "force_control", "telemetry"],
  "firmware": "5.14.0",
  "joints": 6,
  "payload": 10.0,
  "reach": 1300
}
```

### Step 2: Get Fleet Status

View all connected robots and their current status.

```bash
curl "https://api.adverant.ai/proxy/nexus-robotics/api/v1/fleet" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "totalRobots": 1,
  "online": 1,
  "offline": 0,
  "robots": [
    {
      "robotId": "rob_7f8a9b2c",
      "name": "Assembly-Robot-1",
      "status": "idle",
      "health": 98,
      "lastSeen": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Step 3: Assign a Task

Create and execute an AI-optimized motion plan.

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-robotics/api/v1/tasks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "robotId": "rob_7f8a9b2c",
    "taskType": "pick_and_place",
    "pickPose": {
      "x": 500, "y": 200, "z": 100,
      "rx": 0, "ry": 180, "rz": 0
    },
    "placePose": {
      "x": 700, "y": -200, "z": 100,
      "rx": 0, "ry": 180, "rz": 45
    },
    "constraints": {
      "maxVelocity": 1.0,
      "maxAcceleration": 0.5,
      "avoidCollisions": true,
      "optimizeFor": "speed"
    }
  }'
```

**Response:**
```json
{
  "taskId": "task_abc123",
  "status": "executing",
  "estimatedDuration": 4.2,
  "motionPlan": {
    "waypoints": 12,
    "totalDistance": 850,
    "collisionFree": true
  }
}
```

### Step 4: Monitor Robot Telemetry

Get real-time telemetry data from your robot.

```bash
curl "https://api.adverant.ai/proxy/nexus-robotics/api/v1/telemetry/rob_7f8a9b2c" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "robotId": "rob_7f8a9b2c",
  "timestamp": "2025-01-15T10:30:15Z",
  "joints": [
    { "joint": 1, "position": 0.0, "velocity": 0.0, "current": 1.2 },
    { "joint": 2, "position": -90.0, "velocity": 0.0, "current": 2.1 }
  ],
  "tcp": {
    "x": 500.0, "y": 200.0, "z": 100.0,
    "rx": 0.0, "ry": 180.0, "rz": 0.0
  },
  "health": {
    "temperature": 42,
    "vibration": 0.02,
    "predictedMaintenance": "2025-02-15"
  }
}
```

---

## SDK Examples

### TypeScript/JavaScript

```typescript
import { NexusRobotics } from '@nexus/robotics-sdk';

// Initialize client
const robotics = new NexusRobotics({
  apiKey: process.env.NEXUS_API_KEY,
  baseUrl: 'https://api.adverant.ai/proxy/nexus-robotics'
});

// Register a robot
const robot = await robotics.fleet.register({
  name: 'Welding-Robot-1',
  manufacturer: 'fanuc',
  model: 'CRX-10iA',
  ipAddress: '192.168.1.101',
  protocol: 'fanuc_roboguide'
});

console.log(`Robot registered: ${robot.robotId}`);

// Plan and execute motion
const task = await robotics.tasks.create({
  robotId: robot.robotId,
  taskType: 'linear_move',
  targetPose: { x: 400, y: 0, z: 200, rx: 0, ry: 180, rz: 0 },
  constraints: {
    maxVelocity: 0.5,
    avoidCollisions: true
  }
});

// Stream telemetry
robotics.telemetry.stream(robot.robotId, (data) => {
  console.log(`Position: ${data.tcp.x}, ${data.tcp.y}, ${data.tcp.z}`);
});
```

### Python

```python
from nexus_robotics import NexusRobotics
import os

# Initialize client
client = NexusRobotics(
    api_key=os.environ['NEXUS_API_KEY'],
    base_url='https://api.adverant.ai/proxy/nexus-robotics'
)

# Register a robot
robot = client.fleet.register(
    name='Palletizing-Robot-1',
    manufacturer='abb',
    model='IRB 6700',
    ip_address='192.168.1.102',
    protocol='opc_ua'
)

print(f"Robot registered: {robot.robot_id}")

# Get fleet status
fleet = client.fleet.status()
print(f"Total robots online: {fleet.online}")

# Plan navigation path
plan = client.navigation.plan(
    robot_id=robot.robot_id,
    start={'x': 0, 'y': 0, 'z': 500},
    goal={'x': 1000, 'y': 500, 'z': 500},
    avoid_zones=['maintenance-area-1']
)

print(f"Path planned with {plan.waypoints} waypoints")

# Execute the plan
result = client.navigation.execute(plan.plan_id)
print(f"Execution status: {result.status}")
```

---

## Rate Limits

| Tier | Robots | API Calls/min | Tasks/day | Telemetry Interval |
|------|--------|---------------|-----------|-------------------|
| **Starter** | 5 | 100 | 5,000 | 1 second |
| **Professional** | 25 | 500 | 50,000 | 100ms |
| **Enterprise** | Unlimited | Custom | Unlimited | 10ms |

### Pricing

| Tier | Monthly Price | Features |
|------|---------------|----------|
| **Starter** | $99/month | Basic fleet management, task assignment |
| **Professional** | $299/month | Fleet optimization, path planning, analytics |
| **Enterprise** | Custom | Unlimited robots, multi-site, custom integrations |

---

## Next Steps

Now that you have your first robot connected, explore these advanced capabilities:

1. **[Multi-Robot Coordination](/docs/guides/multi-robot.md)**: Orchestrate multiple robots in shared workspaces
2. **[Predictive Maintenance](/docs/guides/maintenance.md)**: Configure AI-powered maintenance scheduling
3. **[Sensor Fusion](/docs/guides/sensors.md)**: Integrate cameras, LiDAR, and force sensors
4. **[Safety Zones](/docs/guides/safety.md)**: Configure human-robot collaboration zones
5. **[Custom Integrations](/docs/api-reference/webhooks.md)**: Set up webhooks and event-driven automation

### Useful Resources

- **API Reference**: [docs.adverant.ai/plugins/robotics/api](https://docs.adverant.ai/plugins/robotics/api)
- **Discord Community**: [discord.gg/adverant](https://discord.gg/adverant)
- **GitHub Examples**: [github.com/adverant/robotics-examples](https://github.com/adverant/robotics-examples)
- **Support**: support@adverant.ai

---

## Troubleshooting

### Robot Not Connecting

1. Verify network connectivity: `ping <robot_ip>`
2. Check firewall rules allow Modbus TCP (port 502) or your protocol port
3. Ensure robot is in remote mode and accepting external commands
4. Verify API key has robotics plugin permissions

### Motion Plan Failures

1. Check if target pose is within robot reach
2. Verify collision zones are correctly configured
3. Review joint limits for your specific robot model
4. Enable debug logging: `?debug=true` query parameter

### High Latency Telemetry

1. Consider deploying the Nexus Edge Connector for sub-10ms latency
2. Reduce telemetry polling frequency if not needed
3. Check network bandwidth between robot and Nexus edge

---

**Need help?** Join our [Discord community](https://discord.gg/adverant) or email support@adverant.ai
