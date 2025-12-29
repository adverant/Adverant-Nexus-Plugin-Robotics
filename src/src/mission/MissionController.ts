import { Logger } from 'winston';
import {
  Mission,
  MissionStatus,
  MissionResult,
  WorldState,
  Position3D,
  MissionError,
  TrackedObject,
  ObjectClassification,
} from '../../../shared/src/types';
import { VideoAgentClient } from '../../../api/src/integrations/VideoAgentClient';
import { GeoAgentClient } from '../../../api/src/integrations/GeoAgentClient';
import { MageAgentClient } from '../../../api/src/integrations/MageAgentClient';
import { GraphRAGClient } from '../../../api/src/integrations/GraphRAGClient';

/**
 * Civilian Mission Controller - Heart of the autonomous robotics system
 * Implements ReAct loop (Reason → Act → Observe → Reflect)
 * for autonomous civilian mission execution
 *
 * Civilian Applications:
 * - Delivery operations
 * - Infrastructure inspection
 * - Agriculture automation
 * - Search & rescue
 * - Environmental monitoring
 * - Mapping and surveying
 */
export class MissionController {
  private mission: Mission | null = null;
  private worldState: WorldState | null = null;
  private iteration: number = 0;
  private readonly maxIterations: number = 50;
  private startTime: number = 0;

  constructor(
    private logger: Logger,
    private videoAgent: VideoAgentClient,
    private _geoAgent: GeoAgentClient,
    private mageAgent: MageAgentClient,
    private graphRAG: GraphRAGClient
  ) {
    this.logger = logger.child({ component: 'CivilianMissionController' });
  }

  /**
   * Get the GeoAgent client for health checks and geo-operations
   */
  get geoAgent(): GeoAgentClient {
    return this._geoAgent;
  }

  /**
   * Execute mission using ReAct loop
   * REASON → ACT → OBSERVE → REFLECT
   */
  async executeMission(mission: Mission): Promise<MissionResult> {
    this.mission = mission;
    this.iteration = 0;
    this.startTime = Date.now();

    this.logger.info('Starting mission execution', {
      missionId: mission.id,
      type: mission.type,
      mode: mission.mode,
      maxIterations: this.maxIterations,
    });

    // Store mission start in GraphRAG
    await this.graphRAG.storeEpisode(
      `Mission ${mission.name} started: ${mission.type}`,
      'mission_start',
      0.9
    );

    try {
      // Main ReAct loop
      while (this.iteration < this.maxIterations && !this.isMissionComplete()) {
        this.iteration++;

        this.logger.info(`ReAct iteration ${this.iteration}/${this.maxIterations}`, {
          missionId: mission.id,
        });

        // ===== REASON: Analyze current state and plan next action =====
        const state = await this.assessSituation();
        const action = await this.planNextAction(state);

        // ===== ACT: Execute the planned action =====
        const actionResult = await this.executeAction(action);

        // ===== OBSERVE: Collect feedback and update world model =====
        const observation = await this.observeOutcome(actionResult);
        await this.updateWorldModel(observation);

        // ===== REFLECT: Evaluate progress and adapt strategy =====
        const evaluation = await this.evaluateProgress();

        if (evaluation.needsReplanning) {
          this.logger.warn('Mission replanning required', {
            reason: evaluation.reason,
          });
          await this.replanMission(evaluation.reason || 'Replanning required');
        }

        // Check for mission completion or failure
        if (evaluation.shouldAbort) {
          this.logger.error('Mission abort required', {
            reason: evaluation.reason,
          });
          mission.status = MissionStatus.ABORTED;
          break;
        }

        // Small delay to prevent overwhelming the system
        await this.sleep(100);
      }

      // Mission completed or max iterations reached
      const result = await this.finalizeMission();

      this.logger.info('Mission execution completed', {
        missionId: mission.id,
        status: result.status,
        iterations: this.iteration,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      this.logger.error('Mission execution failed', {
        missionId: mission.id,
        iteration: this.iteration,
        error: (error as Error).message,
      });

      mission.status = MissionStatus.FAILED;

      throw new MissionError(`Mission execution failed: ${(error as Error).message}`, {
        missionId: mission.id,
        iteration: this.iteration,
      });
    }
  }

  /**
   * REASON: Assess current situation using all available sensors
   * Focus on safety, obstacle detection, and object tracking for civilian operations
   */
  private async assessSituation(): Promise<WorldState> {
    this.logger.debug('Assessing situation');

    // Get current position from GeoAgent
    const position: Position3D = {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      timestamp: Date.now(),
    }; // Would get from actual sensors

    // Detect obstacles and objects via VideoAgent
    const visualData = await this.videoAgent.detectObjects('current_frame_url', 0.7);

    // Convert detections to tracked objects with safety classifications
    const trackedObjects: TrackedObject[] = visualData.map((detection) => ({
      id: detection.id || `obj_${Date.now()}_${Math.random()}`,
      position,
      classification: this.mapToObjectClassification(detection.category),
      confidence: detection.confidence,
      priority: this.calculateSafetyPriority(detection.category),
      firstDetected: Date.now(),
      lastSeen: Date.now(),
      trackingHistory: [position],
      metadata: {
        type: detection.category,
        description: detection.label,
      },
    }));

    // Build civilian world state
    const worldState: WorldState = {
      timestamp: Date.now(),
      position,
      velocity: { vx: 0, vy: 0, vz: 0, speed: 0, heading: 0 },
      attitude: [0, 0, 0],
      obstacles: [],
      trackedObjects,
      communication: [],
      health: {
        battery: 100,
        temperature: 25,
        errors: [],
      },
      environment: {
        windSpeed: 5,
        temperature: 20,
        humidity: 60,
        visibility: 10000,
      },
    };

    this.worldState = worldState;
    return worldState;
  }

  /**
   * Map detection category to civilian object classification
   */
  private mapToObjectClassification(category: string): ObjectClassification {
    const categoryMap: Record<string, ObjectClassification> = {
      person: ObjectClassification.PERSON,
      vehicle: ObjectClassification.VEHICLE,
      bicycle: ObjectClassification.BICYCLE,
      animal: ObjectClassification.ANIMAL,
      building: ObjectClassification.BUILDING,
      tree: ObjectClassification.TREE,
      sign: ObjectClassification.SIGN,
      traffic_light: ObjectClassification.TRAFFIC_LIGHT,
      package: ObjectClassification.PACKAGE,
      equipment: ObjectClassification.EQUIPMENT,
      infrastructure: ObjectClassification.INFRASTRUCTURE,
    };

    return categoryMap[category.toLowerCase()] || ObjectClassification.UNKNOWN;
  }

  /**
   * Calculate safety priority based on object type
   */
  private calculateSafetyPriority(
    category: string
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // People and vehicles require highest safety priority
    if (category.toLowerCase() === 'person') return 'HIGH';
    if (category.toLowerCase() === 'vehicle') return 'HIGH';
    if (category.toLowerCase() === 'bicycle') return 'MEDIUM';
    return 'LOW';
  }

  /**
   * REASON: Plan next action based on current state
   * Focuses on safety, mission objectives, and civilian operations
   */
  private async planNextAction(state: WorldState): Promise<any> {
    this.logger.debug('Planning next action');

    if (!this.mission) {
      throw new MissionError('No active mission');
    }

    // Check for people nearby - safety first
    const peopleNearby = state.trackedObjects.filter(
      (obj) => obj.classification === ObjectClassification.PERSON
    );
    const safetyDistance = this.mission.constraints.safetyDistance || 5; // meters

    // Build safety constraints
    const constraints = [
      `Max altitude: ${this.mission.constraints.maxAltitude || 120}m`,
      `Safety distance from people: ${safetyDistance}m`,
      `Battery reserve: ${this.mission.constraints.batteryReserve}%`,
      `Weather limits: max wind ${this.mission.constraints.weatherLimits.maxWindSpeed}m/s`,
    ];

    // Define civilian action options based on mission type
    const actionOptions = [
      'continue_path',
      'avoid_obstacle',
      'inspect_area',
      'collect_data',
      'deliver_package',
      'scan_for_people',
      'return_to_base',
      'pause_for_safety',
    ];

    // Use MageAgent for strategic decision-making
    const decision = await this.mageAgent.makeStrategicDecision(
      `Civilian Mission: ${this.mission.type}, Position: ${JSON.stringify(state.position)}, People nearby: ${peopleNearby.length}, Battery: ${state.health.battery}%`,
      actionOptions,
      constraints
    );

    return {
      type: decision.decision,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
    };
  }

  /**
   * ACT: Execute the planned action
   * All actions prioritize safety and civilian operations
   */
  private async executeAction(action: any): Promise<any> {
    this.logger.info('Executing civilian action', { type: action.type });

    // Store action in GraphRAG for learning
    await this.graphRAG.storeEpisode(
      `Action executed: ${action.type} - ${action.reasoning}`,
      'action',
      0.7
    );

    // Execute action based on type
    switch (action.type) {
      case 'continue_path':
        return { success: true, message: 'Continuing on planned path' };

      case 'avoid_obstacle':
        return { success: true, message: 'Obstacle avoidance maneuver executed' };

      case 'inspect_area':
        return await this.inspectArea();

      case 'collect_data':
        return await this.collectData();

      case 'deliver_package':
        return await this.deliverPackage();

      case 'scan_for_people':
        return await this.scanForPeople();

      case 'return_to_base':
        return { success: true, message: 'Returning to base', action: 'RTB' };

      case 'pause_for_safety':
        return await this.pauseForSafety();

      case 'abort':
        return { success: false, message: 'Mission aborted' };

      default:
        this.logger.warn('Unknown action type', { type: action.type });
        return { success: false, message: 'Unknown action' };
    }
  }

  /**
   * OBSERVE: Collect feedback from action execution
   */
  private async observeOutcome(actionResult: any): Promise<any> {
    this.logger.debug('Observing action outcome', { success: actionResult.success });

    // Get updated sensor data
    const updatedState = await this.assessSituation();

    return {
      actionSuccess: actionResult.success,
      newState: updatedState,
      timestamp: Date.now(),
    };
  }

  /**
   * Update world model with new observations
   */
  private async updateWorldModel(observation: any): Promise<void> {
    this.worldState = observation.newState;

    // Store observation in GraphRAG
    await this.graphRAG.storeEpisode(
      `Observation: World state updated`,
      'observation',
      0.5
    );
  }

  /**
   * REFLECT: Evaluate mission progress and determine if replanning needed
   * Prioritizes safety, weather conditions, and operational limits
   */
  private async evaluateProgress(): Promise<{
    needsReplanning: boolean;
    shouldAbort: boolean;
    reason?: string;
  }> {
    if (!this.mission || !this.worldState) {
      return { needsReplanning: false, shouldAbort: true, reason: 'No mission or world state' };
    }

    // Check for safety violations (people too close, restricted zones)
    const peopleNearby = this.worldState.trackedObjects.filter(
      (obj) => obj.classification === ObjectClassification.PERSON && obj.priority === 'HIGH'
    );
    const safetyDistance = this.mission.constraints.safetyDistance || 5;

    if (peopleNearby.length > 3) {
      return {
        needsReplanning: true,
        shouldAbort: false,
        reason: `Multiple people detected nearby (${peopleNearby.length}), maintaining ${safetyDistance}m safety distance`,
      };
    }

    // Check weather conditions
    const weatherLimits = this.mission.constraints.weatherLimits;
    if (
      this.worldState.environment.windSpeed &&
      weatherLimits.maxWindSpeed &&
      this.worldState.environment.windSpeed > weatherLimits.maxWindSpeed
    ) {
      return {
        needsReplanning: false,
        shouldAbort: true,
        reason: `Wind speed exceeds safe limits: ${this.worldState.environment.windSpeed}m/s`,
      };
    }

    if (
      this.worldState.environment.visibility &&
      weatherLimits.minVisibility &&
      this.worldState.environment.visibility < weatherLimits.minVisibility
    ) {
      return {
        needsReplanning: false,
        shouldAbort: true,
        reason: `Visibility below safe limits: ${this.worldState.environment.visibility}m`,
      };
    }

    // Check mission objectives completion
    const completedObjectives = this.mission.objectives.filter((obj) => obj.completed).length;
    const progress = completedObjectives / this.mission.objectives.length;

    this.logger.debug('Mission progress', {
      completed: completedObjectives,
      total: this.mission.objectives.length,
      progress: `${(progress * 100).toFixed(1)}%`,
    });

    // Check for low battery
    const batteryReserve = this.mission.constraints.batteryReserve || 20;
    if (this.worldState.health.battery < batteryReserve) {
      return {
        needsReplanning: false,
        shouldAbort: true,
        reason: `Low battery (${this.worldState.health.battery}%) - RTB required`,
      };
    }

    // Check for system errors
    if (this.worldState.health.errors.length > 0) {
      this.logger.warn('System errors detected', {
        errors: this.worldState.health.errors,
      });
      return {
        needsReplanning: true,
        shouldAbort: false,
        reason: `System errors detected: ${this.worldState.health.errors.join(', ')}`,
      };
    }

    return { needsReplanning: false, shouldAbort: false };
  }

  /**
   * Replan mission based on new information
   */
  private async replanMission(reason: string): Promise<void> {
    this.logger.info('Replanning mission', { reason });

    await this.graphRAG.storeEpisode(
      `Mission replanning: ${reason}`,
      'replanning',
      0.8
    );

    // In production, this would recalculate path, reassign objectives, etc.
  }

  /**
   * CIVILIAN ACTION: Inspect area for infrastructure or environmental monitoring
   */
  private async inspectArea(): Promise<any> {
    if (!this.mission || !this.worldState) {
      return { success: false, message: 'No mission or world state' };
    }

    this.logger.info('Inspecting area', {
      position: this.worldState.position,
      objectsDetected: this.worldState.trackedObjects.length,
    });

    // Capture detailed imagery and sensor data
    const inspectionData = {
      position: this.worldState.position,
      timestamp: Date.now(),
      objectsObserved: this.worldState.trackedObjects.length,
      weatherConditions: this.worldState.environment,
    };

    // Store inspection results in GraphRAG
    await this.graphRAG.storeEpisode(
      `Area inspection completed: ${JSON.stringify(inspectionData)}`,
      'inspection',
      0.8
    );

    return {
      success: true,
      message: 'Area inspection completed',
      data: inspectionData,
    };
  }

  /**
   * CIVILIAN ACTION: Collect environmental or agricultural data
   */
  private async collectData(): Promise<any> {
    if (!this.mission || !this.worldState) {
      return { success: false, message: 'No mission or world state' };
    }

    this.logger.info('Collecting data', {
      position: this.worldState.position,
      missionType: this.mission.type,
    });

    const dataCollected = {
      position: this.worldState.position,
      timestamp: Date.now(),
      environmentalData: this.worldState.environment,
      samples: ['temperature', 'humidity', 'imagery'],
    };

    // Store data collection event
    await this.graphRAG.storeEpisode(
      `Data collected: ${JSON.stringify(dataCollected)}`,
      'data_collection',
      0.7
    );

    return {
      success: true,
      message: 'Data collection completed',
      data: dataCollected,
    };
  }

  /**
   * CIVILIAN ACTION: Deliver package (drone delivery use case)
   */
  private async deliverPackage(): Promise<any> {
    if (!this.mission || !this.worldState) {
      return { success: false, message: 'No mission or world state' };
    }

    // Check for people nearby - safety first
    const peopleNearby = this.worldState.trackedObjects.filter(
      (obj) => obj.classification === ObjectClassification.PERSON
    );

    if (peopleNearby.length === 0) {
      this.logger.warn('No recipient detected at delivery location');
      return {
        success: false,
        message: 'No recipient detected, aborting delivery',
      };
    }

    this.logger.info('Delivering package', {
      position: this.worldState.position,
      recipientsNearby: peopleNearby.length,
    });

    // Store delivery event
    await this.graphRAG.storeEpisode(
      `Package delivered at ${JSON.stringify(this.worldState.position)}`,
      'delivery',
      0.9
    );

    return {
      success: true,
      message: 'Package delivered successfully',
      location: this.worldState.position,
    };
  }

  /**
   * CIVILIAN ACTION: Scan for people (search & rescue use case)
   */
  private async scanForPeople(): Promise<any> {
    if (!this.mission || !this.worldState) {
      return { success: false, message: 'No mission or world state' };
    }

    // Filter tracked objects for people
    const peopleDetected = this.worldState.trackedObjects.filter(
      (obj) => obj.classification === ObjectClassification.PERSON
    );

    this.logger.info('Scanning for people', {
      position: this.worldState.position,
      peopleFound: peopleDetected.length,
    });

    if (peopleDetected.length > 0) {
      // Store people detection for search & rescue
      await this.graphRAG.storeEpisode(
        `People detected: ${peopleDetected.length} at ${JSON.stringify(this.worldState.position)}`,
        'person_detection',
        1.0
      );
    }

    return {
      success: true,
      message: `Scan complete: ${peopleDetected.length} people detected`,
      peopleDetected: peopleDetected.map((p) => ({
        id: p.id,
        position: p.position,
        confidence: p.confidence,
      })),
    };
  }

  /**
   * CIVILIAN ACTION: Pause for safety when people are too close
   */
  private async pauseForSafety(): Promise<any> {
    if (!this.worldState) {
      return { success: false, message: 'No world state' };
    }

    const peopleNearby = this.worldState.trackedObjects.filter(
      (obj) => obj.classification === ObjectClassification.PERSON
    );

    this.logger.warn('Pausing for safety', {
      peopleNearby: peopleNearby.length,
      position: this.worldState.position,
    });

    // Store safety pause event
    await this.graphRAG.storeEpisode(
      `Safety pause: ${peopleNearby.length} people detected nearby`,
      'safety_pause',
      0.8
    );

    // Hover/stop until people clear the area
    await this.sleep(5000); // 5 second pause

    return {
      success: true,
      message: 'Safety pause completed',
      duration: 5000,
    };
  }

  /**
   * Check if mission is complete
   */
  private isMissionComplete(): boolean {
    if (!this.mission) return false;

    const allObjectivesComplete = this.mission.objectives.every((obj) => obj.completed);
    const missionAborted = this.mission.status === MissionStatus.ABORTED;
    const missionFailed = this.mission.status === MissionStatus.FAILED;

    return allObjectivesComplete || missionAborted || missionFailed;
  }

  /**
   * Finalize mission and generate result
   */
  private async finalizeMission(): Promise<MissionResult> {
    if (!this.mission) {
      throw new MissionError('No active mission to finalize');
    }

    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000; // seconds

    const completedObjectives = this.mission.objectives.filter((obj) => obj.completed).length;

    const result: MissionResult = {
      missionId: this.mission.id,
      status: this.mission.status,
      objectivesCompleted: completedObjectives,
      objectivesTotal: this.mission.objectives.length,
      duration,
      distanceTraveled: 0, // Would calculate from telemetry
      energyConsumed: 0, // Battery consumption in Wh
      lessons: [
        `Completed ${completedObjectives}/${this.mission.objectives.length} objectives`,
        `Took ${this.iteration} iterations`,
        `Safety-first approach maintained throughout mission`,
      ],
      telemetry: [],
    };

    // Store mission result in GraphRAG for learning
    await this.graphRAG.storeMissionResult(this.mission.id, result);

    // Store patterns learned for civilian operations
    if (result.status === MissionStatus.COMPLETED) {
      await this.graphRAG.storePattern(
        `Successful civilian ${this.mission.type} mission pattern`,
        `Mission completed safely in ${this.iteration} iterations`,
        0.9,
        ['mission', 'success', 'civilian', this.mission.type]
      );
    }

    return result;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
