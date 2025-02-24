import { Widget } from '@lumino/widgets';
import { EchoKernel } from './kernel';
import { globalStyles, animations, overlayStyles, dialogStyles, minimizedStyles, cardStyles, buttonStyles } from './styles';
import { CardProps } from './components/Card';
import { FirmwareService } from './services/FirmwareService';
import { DeviceService } from './services/DeviceService';
import { FlashService } from './services/FlashService';
import { UIService } from './services/UIService';
import { MinimizedButton } from './components/MinimizedButton';
import { Dialog } from './components/Dialog';
import { Overlay } from './components/Overlay';

export default class WelcomePanel extends Widget {
  private buttonContainer: HTMLDivElement;
  private firmwareService: FirmwareService;
  private deviceService: DeviceService;
  private flashService: FlashService;
  private uiService: UIService;
  private minimizedButton: MinimizedButton;
  private dialog!: Dialog;
  private overlay!: Overlay;

  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    
    // Initialize services
    this.firmwareService = FirmwareService.getInstance();
    this.deviceService = DeviceService.getInstance();
    this.flashService = FlashService.getInstance();
    this.uiService = UIService.getInstance();

    // Set initial styles
    this.node.style.position = 'fixed';
    this.node.style.top = '0';
    this.node.style.left = '0';
    this.node.style.width = '100vw';
    this.node.style.height = '100vh';
    this.node.style.zIndex = '1000';
    this.node.style.display = 'none';

    // Initialize UI
    this.buttonContainer = this.uiService.createContainer('esp-button-container');
    this.minimizedButton = new MinimizedButton(() => this.show());
    this.buttonContainer.appendChild(this.minimizedButton.getElement());
    document.body.appendChild(this.buttonContainer);

    // Initialize styles
    this.uiService.initializeStyles([
      globalStyles,
      animations,
      overlayStyles,
      dialogStyles,
      minimizedStyles,
      cardStyles,
      buttonStyles
    ]);

    // Try to load cached firmware
    this.firmwareService.loadCachedFirmware();
  }

  private getConnectCardProps(): CardProps {
    const isConnected = this.deviceService.isConnected();
    return {
      action: 'connect',
      icon: isConnected ? '✓' : '🔌',
      title: isConnected ? 'Device Connected' : 'Connect Device',
      description: isConnected ? 'Click to disconnect' : 'Connect to ESP32 device via serial',
      color: 'var(--ui-navy)'
    };
  }

  private async handleConnect(): Promise<void> {
    try {
      if (!this.deviceService.isConnected()) {
        await this.deviceService.connect();
      } else {
        await this.deviceService.disconnect();
      }
      this.dialog.updateConnectCard(this.getConnectCardProps());
    } catch (err) {
      console.error('Connection error:', err);
      this.dialog.updateConnectCard({
        action: 'connect',
        icon: '❌',
        title: 'Connection Failed',
        description: 'Click to try again',
        color: 'var(--ui-red)'
      });
    }
  }

  async initUI(kernel: EchoKernel): Promise<void> {
    this.overlay = new Overlay(() => this.hide());
    this.dialog = new Dialog({
      onClose: () => this.hide(),
      onConnect: () => this.handleConnect(),
      onFlash: () => this.flashService.flashDevice(),
      onReset: () => this.deviceService.reset(),
      deviceService: this.deviceService
    });

    this.overlay.appendChild(this.dialog.getElement());
    this.node.appendChild(this.overlay.getElement());
  }

  show(): void {
    console.log('Showing panel...');
    this.node.style.display = 'block';
    this.node.classList.remove('minimized');
    this.node.classList.add('visible');
    this.minimizedButton.hide();
    
    // Force a reflow to ensure the transition works
    void this.node.offsetHeight;
    
    // Add transition for smooth appearance
    this.node.style.transition = 'opacity 0.3s ease-in-out';
    this.node.style.opacity = '1';
  }

  hide(): void {
    console.log('Hiding panel...');
    this.node.classList.add('minimizing');
    this.node.classList.remove('visible');
    this.node.style.opacity = '0';
    
    // Show the minimized button after the transition
    setTimeout(() => {
      this.node.style.display = 'none';
      this.node.classList.remove('minimizing');
      this.node.classList.add('minimized');
      this.minimizedButton.show();
    }, 300);
  }
}