import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoading } from './useLoading'

function setup() {
  let api!: ReturnType<typeof useLoading>
  mount(
    defineComponent({
      setup() {
        api = useLoading()
        return () => h('div')
      },
    }),
  )
  return api
}

describe('useLoading', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows loading immediately with no delay', () => {
    const { isLoading, showLoading } = setup()
    showLoading()
    expect(isLoading.value).toBe(true)
  })

  it('delays showing loading when a delay is given', () => {
    const { isLoading, showLoading } = setup()
    showLoading(200)
    expect(isLoading.value).toBe(false)
    vi.advanceTimersByTime(199)
    expect(isLoading.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(isLoading.value).toBe(true)
  })

  it('hideLoading cancels a pending delayed show', () => {
    const { isLoading, showLoading, hideLoading } = setup()
    showLoading(200)
    hideLoading()
    vi.advanceTimersByTime(200)
    expect(isLoading.value).toBe(false)
  })

  it('hideLoading turns off an already-visible loading state', () => {
    const { isLoading, showLoading, hideLoading } = setup()
    showLoading()
    hideLoading()
    expect(isLoading.value).toBe(false)
  })
})
