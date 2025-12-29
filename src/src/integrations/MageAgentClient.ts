import { BaseClient } from './BaseClient';
import { Logger } from 'winston';
import { SERVICE_URLS } from '../../../shared/src/constants';
import { Target, TargetClassification } from '../../../shared/src/types';

export interface AIClassificationRequest {
  model?: string; // 'claude-3-7-sonnet', 'gpt-4o', etc.
  input: {
    visual?: {
      imageUrl: string;
      detections: any[];
    };
    thermal?: {
      temperatureData: any;
      hotspots: any[];
    };
    rf?: {
      emissions: any[];
      signatures: any[];
    };
    kinematic?: {
      speed: number;
      heading: number;
      trajectory: any[];
    };
  };
  categories: TargetClassification[];
  requireReasoning: boolean;
}

export interface AIClassificationResponse {
  category: TargetClassification;
  confidence: number;
  reasoning: string;
  alternativeCategories: Array<{
    category: TargetClassification;
    confidence: number;
  }>;
  processingTime: number;
}

export interface MultiModelConsensusRequest {
  models: string[]; // ['claude-3-7-sonnet', 'gpt-4o', 'gemini-pro']
  input: any;
  task: 'classification' | 'decision' | 'analysis';
}

export interface MultiModelConsensusResponse {
  consensus: {
    result: any;
    confidence: number;
    agreement: number; // 0-1, percentage of models that agree
  };
  individualResults: Array<{
    model: string;
    result: any;
    confidence: number;
    processingTime: number;
  }>;
  totalProcessingTime: number;
}

export interface TaskRequest {
  taskType: string;
  input: any;
  options?: {
    maxAgents?: number;
    timeout?: number;
    mode?: 'sequential' | 'parallel' | 'competition';
  };
}

export interface TaskResponse {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Client for MageAgent service integration
 * Handles AI decision-making, multi-model consensus, and agent orchestration
 */
export class MageAgentClient extends BaseClient {
  constructor(logger: Logger) {
    super('MageAgent', SERVICE_URLS.MAGE_AGENT, logger);
  }

  /**
   * Classify target using AI with multi-modal input
   */
  async classifyTarget(target: Target, categories?: TargetClassification[]): Promise<AIClassificationResponse> {
    this.logger.info('Classifying target', {
      targetId: target.id,
      categories: categories?.length || 'all',
    });

    const request: AIClassificationRequest = {
      model: 'claude-3-7-sonnet', // High-accuracy model for critical decisions
      input: {
        visual: target.features.visual
          ? {
              imageUrl: '', // Would contain actual image URL
              detections: [],
            }
          : undefined,
        thermal: target.features.thermal
          ? {
              temperatureData: target.features.thermal,
              hotspots: target.features.thermal.hotspots,
            }
          : undefined,
        rf: target.features.rf
          ? {
              emissions: [target.features.rf],
              signatures: [],
            }
          : undefined,
        kinematic: target.velocity
          ? {
              speed: target.velocity.speed,
              heading: target.velocity.heading,
              trajectory: target.trackingHistory,
            }
          : undefined,
      },
      categories: categories || Object.values(TargetClassification),
      requireReasoning: true,
    };

    try {
      const response = await this.post<AIClassificationResponse>('/api/classify', request, {
        timeout: 10000, // 10 seconds for AI classification
      });

      this.logger.info('Target classified', {
        targetId: target.id,
        category: response.category,
        confidence: response.confidence,
        processingTime: response.processingTime,
      });

      return response;
    } catch (error) {
      this.logger.error('Target classification failed', {
        targetId: target.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get multi-model consensus for critical decisions
   * Used for high-stakes decisions requiring validation from multiple AI models
   */
  async getMultiModelConsensus(request: MultiModelConsensusRequest): Promise<MultiModelConsensusResponse> {
    this.logger.info('Requesting multi-model consensus', {
      models: request.models,
      task: request.task,
    });

    try {
      const response = await this.post<MultiModelConsensusResponse>('/api/consensus', request, {
        timeout: 30000, // 30 seconds for multi-model processing
      });

      this.logger.info('Multi-model consensus achieved', {
        confidence: response.consensus.confidence,
        agreement: response.consensus.agreement,
        models: request.models.length,
      });

      return response;
    } catch (error) {
      this.logger.error('Multi-model consensus failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create async task for complex operations
   */
  async createTask(request: TaskRequest): Promise<TaskResponse> {
    this.logger.info('Creating async task', {
      taskType: request.taskType,
      options: request.options,
    });

    try {
      const response = await this.post<TaskResponse>('/api/tasks', request);

      this.logger.info('Task created', {
        taskId: response.taskId,
        status: response.status,
      });

      return response;
    } catch (error) {
      this.logger.error('Task creation failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get task status and result
   */
  async getTask(taskId: string): Promise<TaskResponse> {
    try {
      const response = await this.get<TaskResponse>(`/api/tasks/${taskId}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to get task', {
        taskId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Poll task until completion
   */
  async waitForTask(taskId: string, timeoutMs: number = 60000): Promise<TaskResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const task = await this.getTask(taskId);

      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }

      // Wait 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`Task ${taskId} timeout after ${timeoutMs}ms`);
  }

  /**
   * Make strategic decision using AI reasoning
   */
  async makeStrategicDecision(
    situation: string,
    options: string[],
    constraints: string[]
  ): Promise<{
    decision: string;
    reasoning: string;
    confidence: number;
    alternatives: Array<{ option: string; score: number }>;
  }> {
    this.logger.info('Making strategic decision', {
      situation: situation.substring(0, 100),
      optionsCount: options.length,
    });

    try {
      const response = await this.post<any>('/api/decision', {
        situation,
        options,
        constraints,
        model: 'claude-3-7-sonnet',
      });

      return response;
    } catch (error) {
      this.logger.error('Strategic decision failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Analyze threat level using AI
   * @deprecated Use assessObjectSafety() for civilian applications
   */
  async analyzeThreatLevel(target: Target): Promise<{
    threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    reasoning: string;
    recommendedActions: string[];
  }> {
    try {
      const response = await this.post<any>('/api/threat-analysis', {
        target: {
          classification: target.classification,
          position: target.position,
          velocity: target.velocity,
          features: target.features,
          trackingHistory: target.trackingHistory,
        },
      });

      return response;
    } catch (error) {
      this.logger.error('Threat analysis failed', {
        targetId: target.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * CIVILIAN: Classify detected object with safety priority assessment
   * Suitable for civilian robotics applications (delivery, inspection, search & rescue)
   */
  async classifyObject(object: any): Promise<AIClassificationResponse> {
    this.logger.info('Classifying detected object', {
      objectId: object.id,
      type: object.type || 'unknown',
    });

    // Delegate to existing classifyTarget method for backward compatibility
    return this.classifyTarget(object);
  }

  /**
   * CIVILIAN: Assess object safety risk for civilian operations
   * Evaluates whether an object poses a safety concern for the mission
   */
  async assessObjectSafety(object: any): Promise<{
    safetyLevel: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
    confidence: number;
    reasoning: string;
    recommendedActions: string[];
    safetyDistance?: number; // meters
  }> {
    this.logger.info('Assessing object safety', {
      objectId: object.id,
      classification: object.classification,
    });

    try {
      const response = await this.post<any>('/api/safety-assessment', {
        object: {
          id: object.id,
          classification: object.classification,
          position: object.position,
          velocity: object.velocity,
          priority: object.priority,
          metadata: object.metadata,
        },
        context: {
          mission: 'civilian',
          environment: 'populated_area',
        },
      });

      this.logger.info('Safety assessment completed', {
        objectId: object.id,
        safetyLevel: response.safetyLevel,
        confidence: response.confidence,
      });

      return response;
    } catch (error) {
      this.logger.error('Safety assessment failed', {
        objectId: object.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * CIVILIAN: Evaluate mission safety based on current conditions
   * Comprehensive safety check for civilian missions
   */
  async evaluateMissionSafety(params: {
    peopleNearby: number;
    vehiclesNearby: number;
    weatherConditions: any;
    batteryLevel: number;
    systemHealth: any;
  }): Promise<{
    safeToOperate: boolean;
    confidence: number;
    concerns: string[];
    recommendations: string[];
  }> {
    this.logger.info('Evaluating mission safety', {
      peopleNearby: params.peopleNearby,
      batteryLevel: params.batteryLevel,
    });

    try {
      const response = await this.post<any>('/api/mission-safety', {
        ...params,
        missionType: 'civilian',
      });

      return response;
    } catch (error) {
      this.logger.error('Mission safety evaluation failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
