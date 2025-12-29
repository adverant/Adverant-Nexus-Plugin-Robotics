import { BaseClient } from './BaseClient';
import { Logger } from 'winston';
import { SERVICE_URLS } from '../../../shared/src/constants';
import { RFData, EWThreat } from '../../../shared/src/types';

/**
 * Client for SpectrumAgent service integration
 * Handles RF/SIGINT analysis and EW threat detection
 */
export class SpectrumAgentClient extends BaseClient {
  constructor(logger: Logger) {
    super('SpectrumAgent', SERVICE_URLS.SPECTRUM_AGENT, logger);
  }

  async scanSpectrum(bands: string[], mode: 'wideband' | 'narrowband' = 'wideband') {
    return this.post<{ signals: RFData[] }>('/api/spectrum/scan', { bands, mode });
  }

  async detectJamming(frequency: number) {
    return this.post<{ detected: boolean; power: number }>('/api/ew/jamming/detect', { frequency });
  }

  async detectSpoofing() {
    return this.post<{ detected: boolean; confidence: number }>('/api/ew/spoofing/detect', {});
  }

  async classifySignal(rfData: RFData) {
    return this.post<{ classification: string; confidence: number }>('/api/signals/classify', rfData);
  }

  async getActiveThreats() {
    return this.get<{ threats: EWThreat[] }>('/api/ew/threats/active');
  }

  async reportThreat(threat: EWThreat) {
    return this.post('/api/ew/threats/report', threat);
  }
}
