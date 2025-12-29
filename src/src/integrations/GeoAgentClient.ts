import { BaseClient } from './BaseClient';
import { Logger } from 'winston';
import { SERVICE_URLS } from '../../../shared/src/constants';
import { Position3D, Velocity3D } from '../../../shared/src/types';

/**
 * Client for GeoAgent service integration
 * Handles spatial intelligence, trajectory analysis, and asset tracking
 */
export class GeoAgentClient extends BaseClient {
  constructor(logger: Logger) {
    super('GeoAgent', SERVICE_URLS.GEO_AGENT, logger);
  }

  async trackAsset(assetId: string, position: Position3D, velocity?: Velocity3D) {
    return this.post('/api/assets/track', { assetId, position, velocity });
  }

  async getTrajectory(assetId: string) {
    return this.get(`/api/assets/${assetId}/trajectory`);
  }

  async predictPosition(assetId: string, timeAhead: number) {
    return this.post(`/api/assets/${assetId}/predict`, { timeAhead });
  }

  async checkGeofence(position: Position3D, geofenceId: string) {
    return this.post('/api/geofences/check', { position, geofenceId });
  }

  async processLiDAR(lidarData: any) {
    return this.post('/ml/lidar/process', lidarData, { timeout: 60000, baseURL: SERVICE_URLS.GEO_AGENT_ML });
  }

  async processThermal(thermalData: any) {
    return this.post('/ml/thermal/process', thermalData, { timeout: 30000, baseURL: SERVICE_URLS.GEO_AGENT_ML });
  }
}
