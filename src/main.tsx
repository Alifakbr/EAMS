import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

<<<<<<< HEAD
const nativePrint = window.print.bind(window);
window.print = () => {
  const activeElement = document.activeElement;
  const activePopup = activeElement instanceof HTMLElement
    ? activeElement.closest<HTMLElement>('.fixed.inset-0')
    : null;
  const mainContent = document.querySelector<HTMLElement>('main');
  const visiblePopups = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0'))
    .filter((element) => element.getClientRects().length > 0);
  const printTarget = (activePopup?.getClientRects().length ? activePopup : null) ||
    (activeElement instanceof HTMLElement ? activeElement.closest<HTMLElement>('[data-print-area]') : null) ||
    mainContent?.querySelector<HTMLElement>('[data-print-area]') ||
    visiblePopups.at(-1) ||
    mainContent ||
    document.getElementById('root');
  if (!printTarget) {
    nativePrint();
    return;
  }

  const flowPrintTarget = printTarget.hasAttribute('data-print-area');
  const printContainers: HTMLElement[] = [];
  if (flowPrintTarget) {
    printTarget.classList.add('print-scope-flow');
    document.body.classList.add('printing-flow-content');
    let ancestor = printTarget.parentElement;
    while (ancestor && ancestor.id !== 'root') {
      ancestor.classList.add('print-scope-container');
      printContainers.push(ancestor);
      ancestor = ancestor.parentElement;
    }
  }
  printTarget.classList.add('print-scope');
  document.body.classList.add('printing-scoped-content');
  const cleanup = () => {
    printTarget.classList.remove('print-scope');
    printTarget.classList.remove('print-scope-flow');
    printContainers.forEach((container) => container.classList.remove('print-scope-container'));
    document.body.classList.remove('printing-flow-content');
    document.body.classList.remove('printing-scoped-content');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 60_000);
  nativePrint();
};

=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
createRoot(document.getElementById('root')!).render(<App />);
