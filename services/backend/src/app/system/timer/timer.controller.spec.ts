import { CHECK_ABILITY_KEY } from '../../library/casl/decorators/ability.decorator';
import { TimerController } from './timer.controller';

describe('TimerController ability metadata', () => {
  it('protects mutating endpoints with timer permissions', () => {
    const createRules = Reflect.getMetadata(CHECK_ABILITY_KEY, TimerController.prototype.create);
    const updateRules = Reflect.getMetadata(CHECK_ABILITY_KEY, TimerController.prototype.update);
    const removeRules = Reflect.getMetadata(CHECK_ABILITY_KEY, TimerController.prototype.remove);
    const runRules = Reflect.getMetadata(CHECK_ABILITY_KEY, TimerController.prototype.run);

    expect(createRules).toEqual([{ action: 'create', subject: 'Timer' }]);
    expect(updateRules).toEqual([{ action: 'update', subject: 'Timer' }]);
    expect(removeRules).toEqual([{ action: 'delete', subject: 'Timer' }]);
    expect(runRules).toEqual([{ action: 'run', subject: 'Timer' }]);
  });
});
