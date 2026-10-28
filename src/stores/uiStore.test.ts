import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({ soundEnabled: false })
  })

  it('remembers the sound choice across reloads', () => {
    useUiStore.getState().setSoundEnabled(true)
    expect(JSON.parse(localStorage.getItem('gym-ui') ?? '{}').state).toEqual({ soundEnabled: true })
  })

  it('restores the saved choice', async () => {
    localStorage.setItem('gym-ui', JSON.stringify({ state: { soundEnabled: true }, version: 0 }))
    await useUiStore.persist.rehydrate()
    expect(useUiStore.getState().soundEnabled).toBe(true)
  })
})
