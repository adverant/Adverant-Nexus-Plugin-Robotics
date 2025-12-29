import { BaseClient } from './BaseClient';
import { Logger } from 'winston';
import { SERVICE_URLS } from '../../../shared/src/constants';
import { Detection } from '../../../shared/src/types';

export interface VideoProcessingRequest {
  imageUrl?: string;
  imageBuffer?: Buffer;
  operations: string[]; // ['object_detection', 'tracking', 'scene_analysis']
  modelPreference?: 'fast' | 'balanced' | 'accurate';
}

export interface VideoProcessingResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  detections?: Detection[];
  sceneAnalysis?: {
    description: string;
    objects: string[];
    confidence: number;
  };
  processingTime: number;
}

export interface ObjectTrackingRequest {
  frameSequence: Array<{
    timestamp: number;
    imageUrl: string;
    detections: Detection[];
  }>;
  trackingAlgorithm?: 'deepsort' | 'bytetrack';
}

export interface TrackedObject {
  trackId: number;
  detections: Array<{
    frameIndex: number;
    timestamp: number;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
  class: string;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Client for VideoAgent service integration
 * Handles vision processing, object detection, and tracking
 */
export class VideoAgentClient extends BaseClient {
  constructor(logger: Logger) {
    super('VideoAgent', SERVICE_URLS.VIDEO_AGENT, logger);
  }

  /**
   * Process a single frame for object detection
   */
  async processFrame(request: VideoProcessingRequest): Promise<VideoProcessingResponse> {
    this.logger.info('Processing frame', {
      operations: request.operations,
      modelPreference: request.modelPreference,
    });

    try {
      const response = await this.post<VideoProcessingResponse>('/api/process', request, {
        timeout: 30000, // 30 seconds for vision processing
      });

      this.logger.info('Frame processed', {
        jobId: response.jobId,
        detections: response.detections?.length || 0,
        processingTime: response.processingTime,
      });

      return response;
    } catch (error) {
      this.logger.error('Frame processing failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get object detection results for real-time tracking
   */
  async detectObjects(imageUrl: string, threshold: number = 0.7): Promise<Detection[]> {
    try {
      const response = await this.processFrame({
        imageUrl,
        operations: ['object_detection'],
        modelPreference: 'fast', // Fast model for real-time processing
      });

      // Filter by confidence threshold
      const detections = (response.detections || []).filter((d) => d.confidence >= threshold);

      this.logger.debug('Objects detected', {
        total: detections.length,
        threshold,
      });

      return detections;
    } catch (error) {
      this.logger.error('Object detection failed', {
        error: (error as Error).message,
      });
      return []; // Return empty array instead of throwing for graceful degradation
    }
  }

  /**
   * Track objects across multiple frames
   */
  async trackObjects(request: ObjectTrackingRequest): Promise<TrackedObject[]> {
    this.logger.info('Starting object tracking', {
      frames: request.frameSequence.length,
      algorithm: request.trackingAlgorithm || 'deepsort',
    });

    try {
      const response = await this.post<{ tracks: TrackedObject[] }>(
        '/api/tracking',
        request,
        {
          timeout: 60000, // 60 seconds for multi-frame tracking
        }
      );

      this.logger.info('Object tracking completed', {
        tracks: response.tracks.length,
      });

      return response.tracks;
    } catch (error) {
      this.logger.error('Object tracking failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Analyze scene for situational awareness
   */
  async analyzeScene(imageUrl: string): Promise<{
    description: string;
    objects: string[];
    confidence: number;
  }> {
    try {
      const response = await this.processFrame({
        imageUrl,
        operations: ['scene_analysis'],
        modelPreference: 'accurate',
      });

      return (
        response.sceneAnalysis || {
          description: 'Unknown scene',
          objects: [],
          confidence: 0,
        }
      );
    } catch (error) {
      this.logger.error('Scene analysis failed', {
        error: (error as Error).message,
      });
      return {
        description: 'Analysis failed',
        objects: [],
        confidence: 0,
      };
    }
  }

  /**
   * Stream processing for continuous video feed
   */
  async startStreamProcessing(streamUrl: string, callback: (detections: Detection[]) => void): Promise<string> {
    // Note: This would typically use WebSocket for real-time streaming
    // For now, implementing polling-based approach
    this.logger.info('Starting stream processing', { streamUrl });

    try {
      const response = await this.post<{ streamId: string }>('/api/stream/start', {
        streamUrl,
        processingOptions: {
          fps: 10, // Process 10 frames per second
          operations: ['object_detection'],
        },
      });

      // Start polling for results
      this.pollStreamResults(response.streamId, callback);

      return response.streamId;
    } catch (error) {
      this.logger.error('Failed to start stream processing', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Stop stream processing
   */
  async stopStreamProcessing(streamId: string): Promise<void> {
    try {
      await this.post(`/api/stream/${streamId}/stop`, {});
      this.logger.info('Stream processing stopped', { streamId });
    } catch (error) {
      this.logger.error('Failed to stop stream processing', {
        streamId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Poll stream results (internal method)
   */
  private async pollStreamResults(streamId: string, callback: (detections: Detection[]) => void): Promise<void> {
    try {
      const response = await this.get<{ detections: Detection[] }>(`/api/stream/${streamId}/results`);

      if (response.detections && response.detections.length > 0) {
        callback(response.detections);
      }

      // Continue polling (would use WebSocket in production)
      setTimeout(() => this.pollStreamResults(streamId, callback), 100); // 10 Hz
    } catch (error) {
      this.logger.warn('Stream polling error', {
        streamId,
        error: (error as Error).message,
      });
      // Stop polling on error
    }
  }
}
