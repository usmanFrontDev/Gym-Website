import { describe, expect, it } from 'vitest'
import { Path } from '@/constants/paths'
import { Role } from '@/constants/roles'
import { routeRegistry } from './registry'

const entry = (path: Path) => routeRegistry.find((r) => r.path === path)

describe('route registry', () => {
  it('has unique paths', () => {
    const paths = routeRegistry.map((r) => r.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('keeps money pages SUPER_ADMIN only', () => {
    expect(entry(Path.AdminLedger)?.roles).toEqual([Role.SUPER_ADMIN])
    expect(entry(Path.AdminDashboard)?.roles).toEqual([Role.SUPER_ADMIN])
    expect(entry(Path.AdminManagers)?.roles).toEqual([Role.SUPER_ADMIN])
  })

  it('never lets trainers register members', () => {
    for (const path of [Path.AdminMemberNew, Path.ManagerMemberNew]) {
      const roles = entry(path)?.roles
      expect(roles === 'all' ? true : roles?.includes(Role.TRAINER)).toBe(false)
    }
  })

  it('lets managers register members', () => {
    expect(entry(Path.ManagerMemberNew)?.roles).toContain(Role.MANAGER)
  })
})
