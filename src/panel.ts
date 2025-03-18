import { EmbeddedKernel } from './kernel';
import { globalStyles, animations, overlayStyles, dialogStyles, minimizedStyles, cardStyles, buttonStyles, progressOverlayStyles } from './styles';
import { DeviceService } from './services/DeviceService';
import { FlashService } from './services/FlashService';
import { MinimizedButton } from './components/MinimizedButton';
import { Dialog } from './components/Dialog';

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

class MinimizedPanel {
  private element: HTMLDivElement;
  private minimizedButton: MinimizedButton;

  constructor(minimizedButton: MinimizedButton) {
    this.minimizedButton = minimizedButton;
    this.element = document.createElement('div');
    this.element.id = 'minimized-panel-widget-panel';
    this.element.appendChild(minimizedButton.getElement());
  }

  show(): void {
    this.element.style.display = 'block';
    this.element.classList.remove('minimized');
    this.element.classList.add('visible');

    this.element.style.transition = 'opacity 0.3s ease-in-out';
    this.element.style.opacity = '1';
    this.minimizedButton.show();
  }

  hide(): void {
    this.element.classList.add('minimizing');
    this.element.classList.remove('visible');
    this.element.style.opacity = '0';
    this.minimizedButton.hide();

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
  private deviceService: DeviceService = DeviceService.getInstance();
  private flashService: FlashService = FlashService.getInstance();

  private minimizedPanel: MinimizedPanel;
  private dialogPanel: DialogPanel;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'jp-kernel-welcome-panel';
    
    // Add styles
    let styleElement = document.createElement('style');
    styleElement.textContent = [
      globalStyles,
      animations,
      overlayStyles,
      dialogStyles,
      minimizedStyles,
      cardStyles,
      buttonStyles,
      progressOverlayStyles
    ].join('\n');
    document.head.appendChild(styleElement);

    const minimizedButton = new MinimizedButton(() => this.show());
    this.minimizedPanel = new MinimizedPanel(minimizedButton);

    const dialog = new Dialog({
      closeDialog: () => this.hide(),
      deviceService: this.deviceService,
      flashService: this.flashService,
    });
    this.dialogPanel = new DialogPanel(dialog);

    this.element.appendChild(this.minimizedPanel.getElement());
    this.element.appendChild(this.dialogPanel.getElement());
  }

  getElement(): HTMLDivElement {
    return this.element;
  }

  async initUI(kernel: EmbeddedKernel): Promise<void> {
    kernel.deviceService = this.deviceService;
  }

  updated_device_connection_status(): void{

  }

  show(): void {
    this.element.style.display = 'block';
    this.element.classList.remove('minimized');
    this.element.classList.add('visible');

    this.element.style.transition = 'opacity 0.3s ease-in-out';
    this.element.style.opacity = '1';

    this.dialogPanel.show();
    this.minimizedPanel.hide();
  }

  hide(): void {
    this.dialogPanel.hide();
    this.minimizedPanel.show();
  }
}