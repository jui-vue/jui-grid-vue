// jui-ui-vue ships plain .vue/.js source with no type declarations (see its own package.json:
// no "types" field). This is a minimal ambient shim just for the pieces we use (Dropdown).
declare module 'jui-ui-vue' {
  import type { DefineComponent } from 'vue'

  export const Dropdown: DefineComponent<
    {
      modelValue?: boolean
      items?: Array<{ value?: unknown; text?: string; disabled?: boolean; divider?: boolean; title?: boolean; href?: string }>
      close?: boolean
      keydown?: boolean
      width?: number
      height?: number
      left?: number
      top?: number
      anchor?: boolean
      anchorRight?: boolean
      size?: 'normal' | 'large'
      align?: 'left' | 'right'
    },
    { show: (x?: number, y?: number) => void; hide: () => void; move: (x: number, y: number) => void },
    any
  >

  const plugin: { install: (app: unknown) => void }
  export default plugin
}
