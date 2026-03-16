import { CHECK_ABILITY_KEY } from '../../library/casl/decorators/ability.decorator';
import { FileController } from './file.controller';

describe('FileController ability metadata', () => {
  it('protects upload and delete endpoints with file permissions', () => {
    const uploadRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      FileController.prototype.uploadSingle,
    );
    const uploadChunkRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      FileController.prototype.uploadChunk,
    );
    const mergeRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      FileController.prototype.mergeChunks,
    );
    const deleteRules = Reflect.getMetadata(
      CHECK_ABILITY_KEY,
      FileController.prototype.delete,
    );

    expect(uploadRules).toEqual([{ action: 'create', subject: 'File' }]);
    expect(uploadChunkRules).toEqual([{ action: 'create', subject: 'File' }]);
    expect(mergeRules).toEqual([{ action: 'create', subject: 'File' }]);
    expect(deleteRules).toEqual([{ action: 'delete', subject: 'File' }]);
  });
});
