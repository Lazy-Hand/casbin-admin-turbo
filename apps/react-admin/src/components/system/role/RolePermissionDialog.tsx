import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { App, Modal, Spin, Tag, Tree } from "antd"
import type { TreeDataNode } from "antd"
import { assignRolePermissions, getRolePermissions } from "@/api/role"
import { getMenuAndButtonPermissions, type PermissionTreeNode } from "@/api/permission"
import { queryClient } from "@/lib/query-client"

type Props = {
  open: boolean
  roleId?: number | null
  roleName?: string
  onClose: () => void
}

type PermissionTreeDataNode = TreeDataNode & {
  resourceType?: PermissionTreeNode["resourceType"]
  menuType?: PermissionTreeNode["menuType"]
}

function getMenuTypeLabel(menuType?: PermissionTreeNode["menuType"]) {
  const labelMap: Record<string, string> = {
    menu: "菜单夹",
    page: "页面",
    link: "外链",
    iframe: "内嵌",
    window: "新窗口",
    divider: "分割线",
    group: "分组",
  }
  return menuType ? labelMap[menuType] || menuType : ""
}

function normalizeTree(nodes: PermissionTreeNode[] = []): PermissionTreeDataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.permName,
    resourceType: node.resourceType,
    menuType: node.menuType,
    children: normalizeTree(node.children || []),
  }))
}

export function RolePermissionDialog({ open, roleId, roleName, onClose }: Props) {
  const { message } = App.useApp()
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])

  const { data, isFetching } = useQuery({
    queryKey: ["role-permission-dialog", roleId],
    queryFn: async () => {
      const [tree, relations] = await Promise.all([getMenuAndButtonPermissions({}), getRolePermissions(roleId!)])

      return {
        tree,
        checked: Array.from(new Set(relations.map((item) => item.permissionId))),
      }
    },
    enabled: open && Boolean(roleId),
  })

  useEffect(() => {
    if (!open) {
      setCheckedKeys([])
      return
    }

    if (data) {
      setCheckedKeys(data.checked)
    }
  }, [data, open])

  const saveMutation = useMutation({
    mutationFn: async () =>
      assignRolePermissions(
        roleId!,
        checkedKeys.map((key) => Number(key)),
      ),
    onSuccess: async () => {
      message.success("菜单权限分配成功")
      await queryClient.invalidateQueries({ queryKey: ["roles"] })
      await queryClient.invalidateQueries({ queryKey: ["auth-bootstrap"] })
      onClose()
    },
  })

  const treeData = useMemo(() => normalizeTree(data?.tree || []), [data?.tree])

  return (
    <Modal
      open={open}
      title={roleName ? `分配菜单权限 - ${roleName}` : "分配菜单权限"}
      width={760}
      okText="保存"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => {
        if (!checkedKeys.length) {
          message.warning("请至少选择一个菜单权限")
          return
        }

        void saveMutation.mutateAsync()
      }}
      destroyOnHidden
    >
      <Spin spinning={isFetching}>
        <div className="max-h-130 overflow-auto rounded-md border border-slate-200 p-3">
          <Tree
            checkable
            blockNode
            defaultExpandAll
            checkedKeys={checkedKeys}
            treeData={treeData}
            onCheck={(keys) => {
              setCheckedKeys(Array.isArray(keys) ? keys : keys.checked)
            }}
            titleRender={(node) => {
              const permissionNode = node as PermissionTreeDataNode
              const menuTypeLabel = getMenuTypeLabel(permissionNode.menuType)

              return (
                <div className="flex items-center gap-2">
                  <span>{String(node.title)}</span>
                  {permissionNode.resourceType === "button" ? <Tag color="orange">按钮</Tag> : menuTypeLabel ? <Tag color="blue">{menuTypeLabel}</Tag> : null}
                </div>
              )
            }}
          />
        </div>
      </Spin>
    </Modal>
  )
}
