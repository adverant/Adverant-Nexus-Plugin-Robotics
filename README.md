
<h1 align="center">Nexus Robotics</h1>

<p align="center">
  <strong>Industrial Robotics AI Controller</strong>
</p>

<p align="center">
  <a href="https://github.com/adverant/Adverant-Nexus-Plugin-Robotics/actions"><img src="https://github.com/adverant/Adverant-Nexus-Plugin-Robotics/workflows/CI/badge.svg" alt="CI Status"></a>
  <a href="https://github.com/adverant/Adverant-Nexus-Plugin-Robotics/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://marketplace.adverant.ai/plugins/robotics"><img src="https://img.shields.io/badge/Nexus-Marketplace-purple.svg" alt="Nexus Marketplace"></a>
  <a href="https://discord.gg/adverant"><img src="https://img.shields.io/badge/Discord-Community-7289da.svg" alt="Discord"></a>
</p>

<p align="center">
  <a href="#features">Features</a> -
  <a href="#quick-start">Quick Start</a> -
  <a href="#use-cases">Use Cases</a> -
  <a href="#pricing">Pricing</a> -
  <a href="#documentation">Documentation</a>
</p>

---

## Transform Manufacturing with AI-Powered Robotics

**Nexus Robotics** is a comprehensive AI controller for industrial robotics that delivers intelligent motion planning, real-time sensor fusion, and predictive maintenance. Seamlessly integrate with your existing robotic systems to unlock next-generation automation capabilities.

### Why Nexus Robotics?

- **50% Reduction in Downtime**: Predictive maintenance catches failures before they happen
- **Real-Time Motion Planning**: AI-optimized paths for maximum efficiency and safety
- **Universal Compatibility**: Works with major robot manufacturers (ABB, FANUC, KUKA, Universal Robots)
- **Sensor Fusion**: Combine data from cameras, LiDAR, force sensors, and more
- **Edge + Cloud Hybrid**: Deploy intelligence where it matters most

---

## Features

### AI-Powered Motion Planning

Generate optimal motion paths in real-time using advanced trajectory optimization:

| Capability | Description |
|------------|-------------|
| **Collision Avoidance** | Real-time obstacle detection and path replanning |
| **Multi-Robot Coordination** | Orchestrate multiple robots working in shared spaces |
| **Dynamic Optimization** | Continuously optimize for speed, energy, or precision |
| **Safety Zones** | Automatic speed reduction in human-collaboration zones |

### Sensor Fusion Engine

Combine multiple sensor inputs for superior environmental awareness:

- **Vision Systems**: 2D/3D cameras, depth sensors
- **Force/Torque Sensors**: Precise force control for assembly tasks
- **LiDAR/Radar**: Long-range obstacle detection
- **Proximity Sensors**: Close-range safety monitoring
- **Encoders**: Position and velocity feedback

### Predictive Maintenance

AI-driven maintenance scheduling that prevents costly failures:

- **Vibration Analysis**: Detect bearing wear and imbalances
- **Motor Health Monitoring**: Track current draw and temperature trends
- **Lubrication Scheduling**: Optimize maintenance intervals
- **Failure Prediction**: 7-day advance warning on component failures
- **ROI Dashboard**: Track maintenance savings in real-time

---

## Quick Start

### Installation

```bash
# Via Nexus Marketplace (Recommended)
nexus plugin install nexus-robotics

# Or via API
curl -X POST "https://api.adverant.ai/plugins/nexus-robotics/install" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Connect Your First Robot

```bash
# Register a robot
curl -X POST "https://api.adverant.ai/proxy/nexus-robotics/api/v1/robots" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assembly-Robot-1",
    "manufacturer": "universal_robots",
    "model": "UR10e",
    "ipAddress": "192.168.1.100",
    "protocol": "modbus_tcp"
  }'
```

**Response:**
```json
{
  "robotId": "rob_abc123",
  "status": "connected",
  "capabilities": ["motion", "force_control", "vision"]
}
```

### Execute a Motion Plan

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-robotics/api/v1/motion/plan" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "robotId": "rob_abc123",
    "targetPose": {
      "x": 500, "y": 200, "z": 300,
      "rx": 0, "ry": 180, "rz": 0
    },
    "constraints": {
      "maxVelocity": 1.0,
      "avoidCollisions": true
    }
  }'
```

---

## Use Cases

### Manufacturing

#### 1. Pick and Place Optimization
AI-optimized pick and place operations with vision-guided picking for faster cycle times and reduced product damage.

#### 2. Welding Path Planning
Generate optimal welding paths with real-time seam tracking, heat management, and weld quality prediction.

#### 3. Assembly Automation
Force-controlled assembly with adaptive insertion strategies and quality verification at each step.

### Warehousing & Logistics

#### 4. Palletizing Optimization
Dynamic pallet planning that maximizes space utilization while respecting weight distribution constraints.

#### 5. Order Fulfillment
Coordinate multiple robots for efficient order picking with collision-free path planning.

### Predictive Maintenance

#### 6. Fleet Health Monitoring
Monitor entire robot fleets from a single dashboard with automated maintenance scheduling.

#### 7. Spare Parts Prediction
AI predicts which parts will need replacement, optimizing inventory and reducing downtime.

---

## Architecture

```
+------------------------------------------------------------------+
|                       Nexus Robotics Plugin                       |
+------------------------------------------------------------------+
|  +---------------+  +----------------+  +---------------------+   |
|  |    Robot      |  |   Sensor       |  |   Maintenance       |   |
|  |   Manager     |  |   Fusion       |  |   Predictor         |   |
|  +-------+-------+  +-------+--------+  +----------+----------+   |
|          |                  |                      |              |
|          v                  v                      v              |
|  +----------------------------------------------------------+    |
|  |                 Motion Planning Engine                    |    |
|  |  +----------+ +----------+ +----------+ +------------+   |    |
|  |  |Trajectory| |Collision | |Multi-Bot | |Safety      |   |    |
|  |  |Optimizer | |Detector  | |Coord     | |Controller  |   |    |
|  |  +----------+ +----------+ +----------+ +------------+   |    |
|  +----------------------------------------------------------+    |
|          |                                                        |
|          v                                                        |
|  +----------------------------------------------------------+    |
|  |                  Robot Communication Layer                |    |
|  |    Modbus TCP  |  EtherNet/IP  |  OPC-UA  |  ROS 2       |    |
|  +----------------------------------------------------------+    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Nexus Core Services                            |
|  +----------+  +----------+  +----------+  +----------+           |
|  |MageAgent |  | GraphRAG |  |FileProc  |  | Billing  |           |
|  |  (AI)    |  | (Cache)  |  |(Files)   |  |(Usage)   |           |
|  +----------+  +----------+  +----------+  +----------+           |
+------------------------------------------------------------------+
```

---

## Pricing

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| **Price** | $0/mo | $199/mo | $799/mo | Custom |
| **Connected Robots** | 1 | 5 | 25 | Unlimited |
| **Motion Plans/day** | 100 | 5,000 | 50,000 | Unlimited |
| **Sensor Fusion** | Basic | Standard | Advanced | Custom |
| **Predictive Maintenance** | - | Alerts | Full | Custom |
| **Multi-Robot Coord** | - | - | Yes | Yes |
| **Edge Deployment** | - | - | Yes | Yes |
| **SLA** | - | - | 99.5% | 99.99% |
| **Support** | Community | Email | Priority | Dedicated |

[View on Nexus Marketplace](https://marketplace.adverant.ai/plugins/robotics)

---

## Supported Robots

| Manufacturer | Models | Protocol |
|--------------|--------|----------|
| **Universal Robots** | UR3e, UR5e, UR10e, UR16e, UR20 | Modbus TCP, RTDE |
| **ABB** | IRB series | OPC-UA, EGM |
| **FANUC** | CRX, LR Mate, M-series | FANUC ROBOGUIDE |
| **KUKA** | LBR iiwa, KR series | EtherNet/IP, KRL |
| **Yaskawa** | GP series, HC series | MotoPlus |
| **Custom** | Any | ROS 2, Modbus |

---

## Documentation

- [Installation Guide](docs/getting-started/installation.md)
- [Configuration](docs/getting-started/configuration.md)
- [Quick Start](docs/getting-started/quickstart.md)
- [API Reference](docs/api-reference/endpoints.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Safety Guidelines](docs/safety/guidelines.md)

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/robots` | Register a new robot |
| `GET` | `/robots` | List connected robots |
| `GET` | `/robots/:id/status` | Get robot status |
| `POST` | `/motion/plan` | Generate motion plan |
| `POST` | `/motion/execute` | Execute motion plan |
| `GET` | `/sensors/:robotId` | Get sensor data |
| `GET` | `/maintenance/predictions` | Get maintenance predictions |
| `POST` | `/maintenance/schedule` | Schedule maintenance |

Full API documentation: [docs/api-reference/endpoints.md](docs/api-reference/endpoints.md)

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/adverant/Adverant-Nexus-Plugin-Robotics.git
cd Adverant-Nexus-Plugin-Robotics

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

---

## Community & Support

- **Documentation**: [docs.adverant.ai/plugins/robotics](https://docs.adverant.ai/plugins/robotics)
- **Discord**: [discord.gg/adverant](https://discord.gg/adverant)
- **Email**: support@adverant.ai
- **GitHub Issues**: [Report a bug](https://github.com/adverant/Adverant-Nexus-Plugin-Robotics/issues)

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with precision by <a href="https://adverant.ai">Adverant</a></strong>
</p>

<p align="center">
  <a href="https://adverant.ai">Website</a> -
  <a href="https://docs.adverant.ai">Docs</a> -
  <a href="https://marketplace.adverant.ai">Marketplace</a> -
  <a href="https://twitter.com/adverant">Twitter</a>
</p>
