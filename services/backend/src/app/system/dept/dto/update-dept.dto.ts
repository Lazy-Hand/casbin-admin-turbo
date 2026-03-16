import { PartialType } from '@nestjs/swagger';
import { CreateDeptDto } from './create-dept.dto';

/**
 * 更新部门 DTO
 * 所有字段都是可选的
 */
export class UpdateDeptDto extends PartialType(CreateDeptDto) {}
