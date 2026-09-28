import { SESSIONS, type Session } from "../../data/mock";

export interface SessionRepository {
  list(): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
}

class MockSessionRepository implements SessionRepository {
  async list() {
    return [...SESSIONS];
  }
  async get(id: string) {
    return SESSIONS.find((item) => item.id === id) ?? null;
  }
}

export const sessionRepository: SessionRepository = new MockSessionRepository();
