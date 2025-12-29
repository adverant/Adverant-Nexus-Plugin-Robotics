import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import winston from 'winston';
import { SERVICE_PORTS, ENVIRONMENT, SERVICE_URLS } from '../../shared/src/constants';
import { RoboticsError } from '../../shared/src/types';
import { MissionController } from '../../core/src/mission/MissionController';
import { VideoAgentClient } from './integrations/VideoAgentClient';
import { GeoAgentClient } from './integrations/GeoAgentClient';
import { MageAgentClient } from './integrations/MageAgentClient';
import { GraphRAGClient } from './integrations/GraphRAGClient';
import { usageTrackingMiddleware, flushPendingReports } from './middleware/usage-tracking';

// Configure logger
const logger = winston.createLogger({
  level: ENVIRONMENT.IS_PRODUCTION ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Usage tracking middleware (after body parsing)
app.use(usageTrackingMiddleware);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Initialize service clients (civilian configuration)
const videoAgent = new VideoAgentClient(logger);
const geoAgent = new GeoAgentClient(logger);
const mageAgent = new MageAgentClient(logger);
const graphRAG = new GraphRAGClient(logger);

// Initialize civilian mission controller
const missionController = new MissionController(
  logger,
  videoAgent,
  geoAgent,
  mageAgent,
  graphRAG
);

// ==================== ROUTES ====================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'nexus-robotics',
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
    },
  });
});

// Readiness check (civilian services only)
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    const checks = await Promise.all([
      videoAgent.healthCheck(),
      geoAgent.healthCheck(),
      mageAgent.healthCheck(),
      graphRAG.healthCheck(),
    ]);

    const allHealthy = checks.every((check) => check === true);

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: {
        videoAgent: checks[0],
        geoAgent: checks[1],
        mageAgent: checks[2],
        graphRAG: checks[3],
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service dependencies not ready',
      },
    });
  }
});

// Mission routes
app.post('/api/missions', async (req: Request, res: Response) => {
  try {
    const mission = req.body;
    logger.info('Creating mission', { missionId: mission.id });

    // Validate mission
    if (!mission.id || !mission.type) {
      throw new RoboticsError('Invalid mission data', 'VALIDATION_ERROR', 400);
    }

    res.json({
      success: true,
      data: { mission, message: 'Mission created successfully' },
    });
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/missions/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mission = req.body;

    logger.info('Executing mission', { missionId: id });

    // Execute mission asynchronously
    missionController.executeMission(mission).catch((error) => {
      logger.error('Mission execution failed', { missionId: id, error: error.message });
      io.emit(`mission:${id}:failed`, { error: error.message });
    });

    res.json({
      success: true,
      data: { message: 'Mission execution started', missionId: id },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Telemetry routes
app.post('/api/telemetry', (req: Request, res: Response) => {
  try {
    const telemetry = req.body;
    logger.debug('Telemetry received', { platformId: telemetry.platformId });

    // Broadcast telemetry via WebSocket
    io.emit('telemetry', telemetry);

    res.json({ success: true });
  } catch (error) {
    handleError(error, res);
  }
});

// Sensor data routes
app.post('/api/sensors/fusion', async (req: Request, res: Response) => {
  try {
    const sensorData = req.body;
    logger.info('Fusing sensor data', { sensors: Object.keys(sensorData) });

    // Process sensor data (would integrate with Sensor Fusion Engine)
    res.json({
      success: true,
      data: { message: 'Sensor fusion completed' },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Object detection and classification routes (civilian)
app.post('/api/objects/classify', async (req: Request, res: Response) => {
  try {
    const object = req.body;
    logger.info('Classifying object', { objectId: object.id, type: object.type });

    // Use MageAgent for AI-powered object classification
    const classification = await mageAgent.classifyTarget(object);

    res.json({
      success: true,
      data: {
        ...classification,
        safetyPriority: determineSafetyPriority(classification.category),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Object detection endpoint
app.post('/api/objects/detect', async (req: Request, res: Response) => {
  try {
    const { imageUrl, minConfidence = 0.7, focusOnSafety = true } = req.body;
    logger.info('Detecting objects in image', { imageUrl, minConfidence });

    // Use VideoAgent for object detection
    const detections = await videoAgent.detectObjects(imageUrl, minConfidence);

    // Filter for safety-critical objects if requested
    const results = focusOnSafety
      ? detections.filter((d) => ['person', 'vehicle', 'bicycle'].includes(d.category.toLowerCase()))
      : detections;

    res.json({
      success: true,
      data: {
        detections: results,
        totalDetected: detections.length,
        safetyCritical: results.length,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Safety monitoring endpoint
app.get('/api/safety/violations', async (req: Request, res: Response) => {
  try {
    const { platformId } = req.query;
    logger.info('Checking safety violations', { platformId });

    // In production, this would query real-time safety monitoring system
    res.json({
      success: true,
      data: {
        platformId,
        violations: [],
        lastCheck: Date.now(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Helper function for safety priority determination
function determineSafetyPriority(category: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const categoryLower = category.toLowerCase();
  if (categoryLower === 'person') return 'HIGH';
  if (categoryLower === 'vehicle' || categoryLower === 'bicycle') return 'HIGH';
  if (categoryLower === 'animal') return 'MEDIUM';
  return 'LOW';
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  if (err instanceof RoboticsError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: ENVIRONMENT.IS_PRODUCTION ? 'Internal server error' : err.message,
      },
    });
  }
});

// Helper function for error handling
function handleError(error: unknown, res: Response) {
  logger.error('Request error', { error: (error as Error).message });

  if (error instanceof RoboticsError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message,
      },
    });
  }
}

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { id: socket.id });

  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { id: socket.id });
  });

  socket.on('subscribe:telemetry', (platformId: string) => {
    socket.join(`telemetry:${platformId}`);
    logger.info('Client subscribed to telemetry', { platformId });
  });
});

// ==================== SERVER START ====================

const HTTP_PORT = SERVICE_PORTS.ROBOTICS_HTTP;
const WS_PORT = SERVICE_PORTS.ROBOTICS_WS;

httpServer.listen(HTTP_PORT, () => {
  logger.info(`🤖 NexusRobotics Civilian API server running`, {
    httpPort: HTTP_PORT,
    wsPort: WS_PORT,
    environment: ENVIRONMENT.NODE_ENV,
    version: '2.0.0-civilian',
  });
  logger.info('Civilian service integrations:', {
    videoAgent: SERVICE_URLS.VIDEO_AGENT,
    geoAgent: SERVICE_URLS.GEO_AGENT,
    mageAgent: SERVICE_URLS.MAGE_AGENT,
    graphRAG: SERVICE_URLS.GRAPHRAG,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  // Flush pending usage reports before shutdown
  try {
    await flushPendingReports();
  } catch (err) {
    logger.error('Error flushing pending usage reports', { error: err });
  }

  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };
