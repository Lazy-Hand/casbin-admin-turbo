import { CHECK_ABILITY_KEY } from '../../library/casl/decorators/ability.decorator';
import {
  LoginLogController,
  OperationLogController,
} from './operation-log.controller';

describe('OperationLogController ability metadata', () => {
  it('matches operation log permissions with ability subjects', () => {
    const pageRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      OperationLogController.prototype.findPage,
    );
    const detailRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      OperationLogController.prototype.findOne,
    );

    expect(pageRules).toEqual([{ action: 'read', subject: 'OperationLog' }]);
    expect(detailRules).toEqual([{ action: 'read', subject: 'OperationLog' }]);
  });

  it('matches login log permissions with ability subjects', () => {
    const pageRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      LoginLogController.prototype.findPage,
    );

    expect(pageRules).toEqual([{ action: 'read', subject: 'LoginLog' }]);
  });
});
