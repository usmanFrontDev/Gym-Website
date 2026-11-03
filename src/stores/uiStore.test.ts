import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({ soundEnabled: false, speechEnabled: true, volume: 0.6 })
  })

  it('remembers the sound choice across reloads', () => {
    useUiStore.getState().setSoundEnabled(true)
    expect(JSON.parse(localStorage.getItem('gym-ui') ?? '{}').state).toMatchObject({ soundEnabled: true })
  })

  it('restores the saved choice', async () => {
    localStorage.setItem('gym-ui', JSON.stringify({ state: { soundEnabled: true }, version: 0 }))
    await useUiStore.persist.rehydrate()
    expect(useUiStore.getState().soundEnabled).toBe(true)
  })

  it('keeps the volume between 0.1 and 1 and the spoken message on by default', () => {
    expect(useUiStore.getState().speechEnabled).toBe(true)
    useUiStore.getState().setVolume(5)
    expect(useUiStore.getState().volume).toBe(1)
    useUiStore.getState().setVolume(0)
    expect(useUiStore.getState().volume).toBe(0.1)
  })
})
