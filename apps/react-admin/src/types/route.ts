export interface RoutePermissionNode {
  id: number
  permName: string
  permCode: string
  path: string
  icon: string
  menuType: string
  component: string
  sort: number
  cache: number
  hidden: number
  parentId: number | null
  buttons?: string[]
  children?: RoutePermissionNode[]
}
