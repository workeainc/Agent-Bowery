import { HealthController } from '../src/health.controller';

describe('HealthController', () => {
  it('returns ok', () => {
    const c = new HealthController();
    expect(c.health()).toEqual({ status: 'ok' });
  });
});
