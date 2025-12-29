import { BaseClient } from './BaseClient';
import { Logger } from 'winston';
import { SERVICE_URLS } from '../../../shared/src/constants';

/**
 * Client for GraphRAG service integration
 * Handles memory storage, episodic memory, and pattern learning
 */
export class GraphRAGClient extends BaseClient {
  constructor(logger: Logger) {
    super('GraphRAG', SERVICE_URLS.GRAPHRAG, logger);
  }

  async storeEpisode(content: string, type: string, importance: number) {
    return this.post('/api/memory/episodes', { content, type, importance, metadata: { timestamp: Date.now() } });
  }

  async storeDocument(title: string, content: string, metadata: any) {
    return this.post('/api/documents', { title, content, metadata });
  }

  async storePattern(pattern: string, context: string, confidence: number, tags: string[]) {
    return this.post('/api/patterns', { pattern, context, confidence, tags });
  }

  async recallMemory(query: string, limit: number = 5) {
    return this.post('/api/memory/recall', { query, limit, score_threshold: 0.3 });
  }

  async storeMissionResult(missionId: string, result: any) {
    return this.storeDocument(`Mission Result: ${missionId}`, JSON.stringify(result, null, 2), {
      type: 'mission_result',
      missionId,
      timestamp: Date.now(),
    });
  }
}
