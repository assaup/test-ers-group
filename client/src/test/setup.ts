import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// jsdom не умеет модальные диалоги; эмулируем ровно столько, сколько нужно компонентам с <dialog>,
// включая то, как браузер ставит фокус: на первый элемент с [autofocus] в DOM,
// а иначе на первый фокусируемый (проп autoFocus из React DOM-атрибут не ставит)
if (typeof HTMLDialogElement !== 'undefined' && !('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
      const target =
        this.querySelector<HTMLElement>('[autofocus]') ??
        this.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]');
      target?.focus();
    },
    close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
}
