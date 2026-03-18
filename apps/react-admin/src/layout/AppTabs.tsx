import { CloseOutlined, DownOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space, Tabs, Typography } from 'antd'
import type { MenuProps, TabsProps } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import '@/layout/AppTabs.css'
import { getLocalRouteByPath } from '@/config/routes'
import { useAuthStore } from '@/stores/auth'
import { useTabsStore } from '@/stores/tabs'
import type { RoutePermissionNode } from '@/types/route'

function getTabTitle(pathname: string, flatPermissions: RoutePermissionNode[]) {
  if (pathname === '/') {
    return '首页'
  }

  const matchedPermission = flatPermissions.find((item) => item.path === pathname)
  if (matchedPermission?.permName) {
    return matchedPermission.permName
  }

  const matchedRoute = getLocalRouteByPath(pathname)
  if (matchedRoute?.title) {
    return matchedRoute.title
  }

  return pathname
}

export function AppTabs() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const flatPermissions = useAuthStore((state) => state.flatPermissions)
  const tabs = useTabsStore((state) => state.tabs)
  const ensureTab = useTabsStore((state) => state.ensureTab)
  const removeTab = useTabsStore((state) => state.removeTab)
  const closeLeftTabs = useTabsStore((state) => state.closeLeftTabs)
  const closeRightTabs = useTabsStore((state) => state.closeRightTabs)
  const closeOtherTabs = useTabsStore((state) => state.closeOtherTabs)
  const closeAllTabs = useTabsStore((state) => state.closeAllTabs)
  const reorderTabs = useTabsStore((state) => state.reorderTabs)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  useEffect(() => {
    ensureTab({
      key: pathname,
      title: getTabTitle(pathname, flatPermissions),
      fullPath: pathname,
      affix: pathname === '/',
    })
  }, [ensureTab, flatPermissions, pathname])

  const handleRemove = useCallback((targetKey: string) => {
    const targetIndex = tabs.findIndex((item) => item.fullPath === targetKey)
    const fallbackTab = tabs[targetIndex - 1] ?? tabs[targetIndex + 1] ?? tabs[0]

    removeTab(targetKey)

    if (pathname === targetKey && fallbackTab) {
      navigate({ to: fallbackTab.fullPath })
    }
  }, [navigate, pathname, removeTab, tabs])

  const items = useMemo<TabsProps['items']>(
    () =>
      tabs.map((tab) => ({
        key: tab.fullPath,
        closable: !tab.affix,
        label: (
          <Dropdown
            trigger={['contextMenu']}
            menu={{
              items: [
                {
                  key: 'close-current',
                  label: '关闭当前标签',
                  disabled: tab.affix,
                },
                {
                  key: 'close-left',
                  label: '关闭左侧标签',
                  disabled: tab.affix || tabs.findIndex((item) => item.fullPath === tab.fullPath) <= 1,
                },
                {
                  key: 'close-right',
                  label: '关闭右侧标签',
                  disabled:
                    tab.affix ||
                    tabs.findIndex((item) => item.fullPath === tab.fullPath) === tabs.length - 1,
                },
                {
                  key: 'close-others',
                  label: '关闭其他标签',
                },
                {
                  key: 'close-all',
                  label: '关闭全部标签',
                },
              ],
              onClick: ({ key }) => {
                if (key === 'close-current') {
                  handleRemove(tab.fullPath)
                  return
                }

                if (key === 'close-left') {
                  closeLeftTabs(tab.fullPath)
                  return
                }

                if (key === 'close-right') {
                  closeRightTabs(tab.fullPath)
                  return
                }

                if (key === 'close-others') {
                  closeOtherTabs(tab.fullPath)
                  if (pathname !== tab.fullPath) {
                    navigate({ to: tab.fullPath })
                  }
                  return
                }

                closeAllTabs()
                navigate({ to: '/' })
              },
            }}
          >
            <span
              data-affix={tab.affix ? 'true' : 'false'}
              draggable={!tab.affix}
              onDragStart={(event) => {
                if (tab.affix) {
                  return
                }

                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', tab.fullPath)
                setDraggingKey(tab.fullPath)
              }}
              onDragOver={(event) => {
                if (tab.affix) {
                  return
                }

                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()
                const activePath = event.dataTransfer.getData('text/plain')
                reorderTabs(activePath, tab.fullPath)
                setDraggingKey(null)
              }}
              onDragEnd={() => {
                setDraggingKey(null)
              }}
              className="app-tabs__label"
              style={{
                cursor: tab.affix ? 'default' : 'grab',
                opacity: draggingKey === tab.fullPath ? 0.5 : 1,
              }}
            >
              <Space size={6}>
                <Typography.Text
                  className={`app-tabs__label-text${pathname === tab.fullPath ? ' app-tabs__label-text--active' : ''}`}
                  style={{ fontWeight: pathname === tab.fullPath ? 600 : 450 }}
                >
                  {tab.title}
                </Typography.Text>
              </Space>
            </span>
          </Dropdown>
        ),
      })),
    [
      closeAllTabs,
      closeLeftTabs,
      closeOtherTabs,
      closeRightTabs,
      draggingKey,
      handleRemove,
      navigate,
      pathname,
      reorderTabs,
      tabs,
    ],
  )

  const actionItems = useMemo<MenuProps['items']>(
    () => [
      { key: 'close-others', label: '关闭其他标签' },
      { key: 'close-all', label: '关闭全部标签' },
    ],
    [],
  )

  const handleChange = (key: string) => {
    navigate({ to: key })
  }

  const handleEdit: TabsProps['onEdit'] = (targetKey, action) => {
    if (action === 'remove' && typeof targetKey === 'string') {
      handleRemove(targetKey)
    }
  }

  const handleActionMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'close-others') {
      closeOtherTabs(pathname)
      return
    }

    closeAllTabs()
    navigate({ to: '/' })
  }

  return (
    <div className="app-tabs">
      <Tabs
        className="app-tabs__tabs"
        hideAdd
        activeKey={pathname}
        items={items}
        type="editable-card"
        onChange={handleChange}
        onEdit={handleEdit}
        tabBarStyle={{ margin: 0 }}
        tabBarExtraContent={{
          right: (
            <Dropdown
              menu={{
                items: actionItems,
                onClick: handleActionMenuClick,
              }}
            >
              <Button type="text" size="small" className="app-tabs__actions">
                <Space size={4}>
                  标签操作
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          ),
        }}
        removeIcon={<CloseOutlined />}
      />
    </div>
  )
}
