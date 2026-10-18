import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';

type DraftStatus = { state: 'saving' | 'saved' | 'error'; message: string };
type DraftableControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const formControls = (form: HTMLFormElement): DraftableControl[] =>
  Array.from(form.elements).filter((element): element is DraftableControl =>
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
  ).filter((element) => !['password', 'file', 'submit', 'button', 'reset'].includes(element.type));

const keyForForm = (form: HTMLFormElement): string => {
  const popup = form.closest<HTMLElement>('.fixed.inset-0');
  const title = popup?.querySelector('h1, h2, h3')?.textContent?.trim() ||
    form.getAttribute('aria-label') || form.getAttribute('action') || 'form';
  const fields = formControls(form).map((field) => `${field.name || field.id || field.tagName}:${field.type}`);
  const source = `${window.location.hash}|${title}|${fields.join(',')}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  }
  return `form-${(hash >>> 0).toString(36)}`;
};

const fieldEntries = (form: HTMLFormElement): [string, DraftableControl][] => {
  const duplicates = new Map<string, number>();
  return formControls(form).map((field) => {
    const base = field.name || field.id || field.tagName.toLowerCase();
    const count = duplicates.get(base) || 0;
    duplicates.set(base, count + 1);
    return [`${base}#${count}`, field];
  });
};

const readForm = (form: HTMLFormElement): Record<string, string> =>
  Object.fromEntries(fieldEntries(form).map(([key, field]) => {
    if (field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type)) {
      return [key, field.checked ? 'true' : 'false'];
    }
    if (field instanceof HTMLSelectElement && field.multiple) {
      return [key, Array.from(field.selectedOptions, (option) => option.value).join('\u001f')];
    }
    return [key, field.value];
  }));

const writeForm = (form: HTMLFormElement, data: Record<string, string>) => {
  form.dataset.draftRestoring = 'true';
  fieldEntries(form).forEach(([key, field]) => {
    if (!(key in data)) return;
    const value = data[key];
    if (field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type)) {
      field.checked = value === 'true';
    } else if (field instanceof HTMLSelectElement && field.multiple) {
      const selected = new Set(value.split('\u001f'));
      Array.from(field.options).forEach((option) => { option.selected = selected.has(option.value); });
    } else {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value')?.set;
      setter?.call(field, value);
    }
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
  delete form.dataset.draftRestoring;
};

export const DraftPersistence: React.FC<{ userId: string }> = ({ userId }) => {
  const [status, setStatus] = useState<DraftStatus | null>(null);

  useEffect(() => {
    setStatus(null);
    let active = true;
    const timers = new Map<string, number>();
    const writes = new Map<string, Promise<void>>();
    const dirtyForms = new WeakSet<HTMLFormElement>();
    const submittedForms = new Map<HTMLFormElement, string>();
    let restoreSequence = 0;

    const publish = (next: DraftStatus) => {
      setStatus(next);
      if (next.state === 'saved') {
        window.setTimeout(() => setStatus((current) => current === next ? null : current), 2500);
      }
    };

    const ensureForm = (form: HTMLFormElement) => {
      if (form.dataset.draftKey || formControls(form).length === 0) return;
      const key = keyForForm(form);
      form.dataset.draftKey = key;
      const sequence = ++restoreSequence;
      void api.getFormDraft(key).then((result) => {
        if (active && result.data && !dirtyForms.has(form) && form.isConnected) writeForm(form, result.data);
      }).catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Draft could not be loaded.';
        publish({ state: 'error', message: `Failed to load draft: ${message}` });
      });
      form.dataset.draftRestoreSequence = String(sequence);
    };

    const save = (form: HTMLFormElement) => {
      ensureForm(form);
      if (!form.dataset.draftKey || form.dataset.draftRestoring) return;
      dirtyForms.add(form);
      const key = form.dataset.draftKey;
      const snapshot = readForm(form);
      const existingTimer = timers.get(key);
      if (existingTimer) window.clearTimeout(existingTimer);
      timers.set(key, window.setTimeout(() => {
        publish({ state: 'saving', message: 'Saving draft…' });
        const write = api.saveFormDraft(key, snapshot).then(() => {
          publish({ state: 'saved', message: 'Draft saved automatically.' });
        }).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Draft could not be saved.';
          publish({ state: 'error', message: `Failed to save draft: ${message}` });
        }).finally(() => {
          if (writes.get(key) === write) writes.delete(key);
        });
        writes.set(key, write);
      }, 700));
    };

    const onInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const form = target.closest('form');
      if (form) save(form);
    };
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      ensureForm(form);
      if (form.dataset.draftKey) submittedForms.set(form, form.dataset.draftKey);
    };
    const scan = (root: ParentNode) => {
      if (root instanceof HTMLFormElement) ensureForm(root);
      root.querySelectorAll?.('form').forEach((form) => ensureForm(form));
      submittedForms.forEach((key, form) => {
        if (!form.isConnected) {
          submittedForms.delete(form);
          const timer = timers.get(key);
          if (timer) window.clearTimeout(timer);
          const priorWrite = writes.get(key) || Promise.resolve();
          void priorWrite.then(() => api.deleteFormDraft(key)).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Draft could not be deleted.';
            publish({ state: 'error', message: `Failed to clear draft: ${message}` });
          });
        }
      });
    };

    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    document.addEventListener('submit', onSubmit, true);
    const observer = new MutationObserver((changes) => changes.forEach((change) => {
      change.addedNodes.forEach((node) => { if (node instanceof HTMLElement) scan(node); });
      scan(document);
    }));
    observer.observe(document.body, { childList: true, subtree: true });
    scan(document);

    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onInput, true);
      document.removeEventListener('submit', onSubmit, true);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [userId]);

  if (!status) return null;
  return (
    <div role={status.state === 'error' ? 'alert' : 'status'}
      className={`no-print fixed bottom-3 right-3 z-[80] max-w-[calc(100vw-1.5rem)] rounded-lg px-3 py-2 text-xs shadow-lg ${
        status.state === 'error' ? 'bg-rose-700 text-white' : 'bg-slate-900 text-white'
      }`}>
      {status.message}
    </div>
  );
};
