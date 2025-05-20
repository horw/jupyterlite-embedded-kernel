import '/style/custom.css';

import { Dialog } from './components/Dialog';
import { ServiceContainer } from './services/ServiceContainer';

class DialogPanel {
  private element: HTMLDivElement;

  constructor(dialog: Dialog) {
    this.element = document.createElement('div');
    this.element.id = 'dialog-widget-panel';
    this.element.appendChild(dialog.getElement());
  }

  show(): void {
    this.element.style.display = 'block';
    this.element.classList.remove('minimized');
    this.element.classList.add('visible');

    this.element.style.transition = 'opacity 0.3s ease-in-out';
    this.element.style.opacity = '1';
  }

  hide(): void {
    this.element.classList.add('minimizing');
    this.element.classList.remove('visible');
    this.element.style.opacity = '0';

    setTimeout(() => {
      this.element.style.display = 'none';
      this.element.classList.remove('minimizing');
      this.element.classList.add('minimized');
    }, 300);
  }

  getElement(): HTMLDivElement {
    return this.element;
  }
}

export default class WelcomePanel {
  private element: HTMLDivElement;

  private dialogPanel: DialogPanel;

  constructor(private serviceContainer: ServiceContainer) {

    this.element = document.createElement('div');
    this.element.id = 'jp-kernel-welcome-panel';

    const dialog = new Dialog({
      closeDialog: () => this.hide(),
      serviceContainer: this.serviceContainer,
    });
    this.dialogPanel = new DialogPanel(dialog);

    this.element.appendChild(this.dialogPanel.getElement());

    document.addEventListener('deviceConnected', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail)
      {
        if (customEvent.detail.msg) {
          console.log(customEvent.detail.msg)
        }
      }
    });

    document.addEventListener('deviceDisconnected', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail)
      {
        if (customEvent.detail.msg) {
          console.log(customEvent.detail.msg)
        }
      }
    });
  }

  getElement(): HTMLDivElement {
    return this.element;
  }


  show(): void {
    this.element.style.display = 'block';
    this.element.classList.remove('minimized');
    this.element.classList.add('visible');

    this.element.style.transition = 'opacity 0.3s ease-in-out';
    this.element.style.opacity = '1';

    this.dialogPanel.show();
  }

  hide(): void {
    this.dialogPanel.hide();
  }
}