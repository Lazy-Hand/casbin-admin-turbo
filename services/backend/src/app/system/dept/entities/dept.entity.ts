/**
 * 部门实体响应类
 */
export class DeptEntity {
  id: number;
  name: string;
  parentId: number | null;
  ancestors: string | null;
  leaderId: number | null;
  status: number;
  sort: number;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: number | null;
  updatedBy: number | null;
  deletedBy: number | null;

  // 关联数据（可选）
  leader?: {
    id: number;
    username: string;
    nickname: string;
  } | null;
  parent?: {
    id: number;
    name: string;
  } | null;
  children?: DeptEntity[];

  /**
   * 从原始模型转换为实体
   */
  static fromModel(dept: any & { leader?: any; parent?: any; children?: any[] }): DeptEntity {
    const entity: DeptEntity = {
      id: dept.id,
      name: dept.name,
      parentId: dept.parentId,
      ancestors: dept.ancestors,
      leaderId: dept.leaderId,
      status: dept.status,
      sort: dept.sort,
      remark: dept.remark,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      deletedAt: dept.deletedAt,
      createdBy: dept.createdBy,
      updatedBy: dept.updatedBy,
      deletedBy: dept.deletedBy,
    };

    if (dept.leader) {
      entity.leader = {
        id: dept.leader.id,
        username: dept.leader.username,
        nickname: dept.leader.nickname,
      };
    }

    if (dept.parent) {
      entity.parent = {
        id: dept.parent.id,
        name: dept.parent.name,
      };
    }

    if (dept.children && dept.children.length > 0) {
      entity.children = dept.children.map((child: any) => DeptEntity.fromModel(child));
    }

    return entity;
  }
}
