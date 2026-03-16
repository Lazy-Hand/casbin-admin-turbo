import { computed, reactive } from 'vue'

const layoutConfig = reactive({
  primary: 'emerald',
  darkTheme: false,
  layoutMode: 'vertical',
})

const layoutState = reactive({
  staticMenuInactive: false,
  overlayMenuActive: false,
  mobileMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  sidebarExpanded: false,
  menuHoverActive: false,
  activeMenuItem: null as unknown,
  activePath: null as string | null,
  anchored: false,
  collapsed: false,
})

export function useLayout() {
  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle()

      return
    }

    document.startViewTransition(() => executeDarkModeToggle())
  }

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme
    document.documentElement.classList.toggle('app-dark')
  }

  const toggleConfigSidebar = () => {
    layoutState.configSidebarVisible = !layoutState.configSidebarVisible
  }

  const hideMobileMenu = () => {
    layoutState.mobileMenuActive = false
  }

  const isDarkTheme = computed(() => layoutConfig.darkTheme)
  const isDesktop = () => window.innerWidth > 991

  const hasOpenOverlay = computed(() => layoutState.overlayMenuActive)

  const toggleCollapsed = () => {
    layoutState.collapsed = !layoutState.collapsed
  }

  return {
    layoutConfig,
    layoutState,
    isDarkTheme,
    toggleDarkMode,
    toggleConfigSidebar,
    hideMobileMenu,
    isDesktop,
    hasOpenOverlay,
    toggleCollapsed,
  }
}
