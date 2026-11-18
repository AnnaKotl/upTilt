import { ref } from 'vue';

// Keep notes close to the pointer, or next to the focused control on a keyboard.
export function usePointerNote() {
  const surface = ref<HTMLElement>();
  const noteAt = ref({ left: '0px', top: '0px' });
  function place(event: MouseEvent | FocusEvent) {
    if (!surface.value) return;
    const area = surface.value.getBoundingClientRect();
    const button = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouse = 'clientX' in event && (event.clientX || event.clientY);
    const x = (mouse ? event.clientX : button.right) - area.left;
    const y = (mouse ? event.clientY : button.bottom) - area.top;
    const inset = 14;
    const width = Math.min(272, area.width - inset * 2);
    noteAt.value = {
      left:
        Math.max(inset, Math.min(x + inset, area.width - width - inset)) + 'px',
      top:
        (y > area.height - 115 ? Math.max(inset, y - 100) : y + inset) + 'px',
    };
  }
  return { surface, noteAt, place };
}
