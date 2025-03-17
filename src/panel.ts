import { Widget } from '@lumino/widgets';
import { EmbeddedKernel } from './kernel';
import { globalStyles, animations, overlayStyles, dialogStyles, minimizedStyles, cardStyles, buttonStyles, progressOverlayStyles } from './styles';
import { FirmwareService } from './services/FirmwareService';
import { DeviceService } from './services/DeviceService';
import { FlashService } from './services/FlashService';
import { UIService } from './services/UIService';
import { MinimizedButton } from './components/MinimizedButton';
import { Dialog } from './components/Dialog';

export default class WelcomePanel extends Widget {
  private firmwareService: FirmwareService = FirmwareService.getInstance();
  private deviceService: DeviceService = DeviceService.getInstance();
  private flashService: FlashService = FlashService.getInstance();
  private uiService: UIService = UIService.getInstance();
  private minimizedButton: MinimizedButton;
  private dialog!: Dialog;

  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');

    this.minimizedButton = new MinimizedButton(() => this.show());
    document.body.appendChild(this.minimizedButton.getElement());

    this.uiService.initializeStyles([
      globalStyles,
      animations,
      overlayStyles,
      dialogStyles,
      minimizedStyles,
      cardStyles,
      buttonStyles,
      progressOverlayStyles
    ]);

    document.addEventListener("writeHelloWorld", (e: Event) => {
        const customEvent = e as CustomEvent<{ title: string }>;
        console.log(customEvent.detail.title);
    });
  }

  async initUI(kernel: EmbeddedKernel): Promise<void> {
    this.dialog = new Dialog(
      {
        onCloseDialog: () => this.hide(),
        onConnect: () => this.deviceService.connect(),
        onFlash: () => this.flashService.flashDevice(),
        onReset: () => this.deviceService.reset(),
        deviceService: this.deviceService,
        firmwareService: this.firmwareService
      },
      ()=> this.hide()
    );

    this.node.appendChild(this.dialog.getElement());
    kernel.deviceService = this.deviceService;
  }

  show(): void {
    console.log('Showing panel...');
    this.node.style.display = 'block';
    this.node.classList.remove('minimized');
    this.node.classList.add('visible');
    this.minimizedButton.hide();
    
    // Add transition for smooth appearance
    this.node.style.transition = 'opacity 0.3s ease-in-out';
    this.node.style.opacity = '1';
  }

  hide(): void {
    console.log('Hiding panel...');
    this.node.classList.add('minimizing');
    this.node.classList.remove('visible');
    this.node.style.opacity = '0';
    
    setTimeout(() => {
      this.node.style.display = 'none';
      this.node.classList.remove('minimizing');
      this.node.classList.add('minimized');
      this.minimizedButton.show();
    }, 300);
  }
}