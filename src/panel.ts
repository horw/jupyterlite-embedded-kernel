import { ESPLoader, FlashOptions, LoaderOptions } from 'esptool-js';
import { Widget } from '@lumino/widgets';
import * as CryptoJS from 'crypto-js';
import { EchoKernel } from './kernel';
import { globalStyles, animations, overlayStyles, dialogStyles, minimizedStyles, cardStyles, buttonStyles } from './styles';
import { Card, CardProps } from './components/Card';
import { ProgressOverlay } from './components/ProgressOverlay';
import { FirmwareService } from './services/FirmwareService';
import { DeviceService } from './services/DeviceService';
import { ErrorHandler } from './utils/ErrorHandler';

// Create WelcomePanel class outside the plugin
export default class WelcomePanel extends Widget {
  private buttonContainer: HTMLElement;
  private styleElement: HTMLStyleElement | null = null;
  private firmwareService: FirmwareService;
  private deviceService: DeviceService;
  private connectCard: Card | null = null;

  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    
    // Set initial styles
    this.node.style.position = 'fixed';
    this.node.style.top = '0';
    this.node.style.left = '0';
    this.node.style.width = '100vw';
    this.node.style.height = '100vh';
    this.node.style.zIndex = '1000';
    this.node.style.display = 'none';  // Initially hidden

    this.firmwareService = FirmwareService.getInstance();
    this.deviceService = DeviceService.getInstance();

    // Try to load cached firmware
    this.firmwareService.loadCachedFirmware();

    // Create button container
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'esp-button-container';
    this.createMinimizedButton();

    // Initialize styles
    this.initializeStyles();
  }

  private createMinimizedButton(): void {
    const button = document.createElement('button');
    button.className = 'minimized-button';
    
    // Create and add the logo image
    const img = document.createElement('img');
    img.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
    img.alt = 'Espressif Systems Logo';
    button.appendChild(img);
    
    button.title = 'Open ESP32 Device Manager';
    button.style.display = 'none'; // Initially hidden
    button.addEventListener('click', () => this.show());
    this.buttonContainer.appendChild(button);
    document.body.appendChild(this.buttonContainer);
  }

  private initializeStyles(): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      ${globalStyles}
      ${animations}
      ${overlayStyles}
      ${dialogStyles}
      ${minimizedStyles}
      ${cardStyles}
      ${buttonStyles}
    `;
    document.head.appendChild(this.styleElement);
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
        this.connectCard?.update(this.getConnectCardProps());
      } else {
        await this.deviceService.disconnect();
        this.connectCard?.update(this.getConnectCardProps());
      }
    } catch (err) {
      console.error('Connection error:', err);
      if (this.connectCard) {
        this.connectCard.update({
          action: 'connect',
          icon: '❌',
          title: 'Connection Failed',
          description: 'Click to try again',
          color: 'var(--ui-red)'
        });
      }
    }
  }

  private async handleFlash(): Promise<void> {
    const progressOverlay = new ProgressOverlay();
    try {
      await this.deviceService.disconnect();
      await this.deviceService.connect();
      progressOverlay.show();

      const transport = this.deviceService.getTransport();
      if (!transport) {
        throw new Error('Failed to get device transport');
      }

      const loaderOptions: LoaderOptions = {
        transport: transport,
        baudrate: 115600,
        romBaudrate: 115600
      };
      const esploader = new ESPLoader(loaderOptions);

      progressOverlay.setStatus('Connecting to device...');
      await esploader.main();

      let firmwareString = this.firmwareService.getFirmwareString();
      if (!firmwareString) {
        progressOverlay.setStatus('Downloading firmware...');
        firmwareString = await this.firmwareService.downloadFirmware();
      }

      const flashOptions: FlashOptions = {
        fileArray: [{
          data: firmwareString,
          address: 0x0
        }],
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        flashMode: "dio",
        flashFreq: "40m",
        reportProgress: (fileIndex, written, total) => {
          progressOverlay.updateProgress(written, total);
          console.log('Flash progress:', {fileIndex, written, total});
        },
        calculateMD5Hash: (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString()
      };

      await esploader.writeFlash(flashOptions);
      progressOverlay.setStatus('Flash complete!');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      const errorMessage = ErrorHandler.getErrorMessage(err);
      progressOverlay.setStatus(`Flash failed: ${errorMessage}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      await progressOverlay.hide();
    }
  }

  private async handleReset(): Promise<void> {
    try {
      await this.deviceService.reset();
      console.log("Device was reset successfully");
    } catch (err) {
      console.error("Failed to reset device:", ErrorHandler.getErrorMessage(err));
    }
  }

  async initUI(kernel: EchoKernel): Promise<void> {
    this.initializeStyles();
    console.log('Initializing UI...');

    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    const container = document.createElement('div');
    container.className = 'welcome-dialog';

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => this.hide());

    const header = document.createElement('div');
    header.innerHTML = '<h1 class="welcome-title">ESP32 Device Manager</h1>';

    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

    // Create cards
    this.connectCard = new Card(this.getConnectCardProps(), () => this.handleConnect());

    const flashCard = new Card({
      action: 'flash',
      icon: '⚡️',
      title: 'Flash Device',
      description: 'Flash your device with the latest firmware',
      color: 'var(--ui-red)'
    }, () => this.handleFlash());

    const resetCard = new Card({
      action: 'reset-esp',
      icon: '🔄',
      title: 'Hard reset Esp',
      description: 'Hard reset esp chip',
      color: 'var(--ui-red)'
    }, () => this.handleReset());

    optionsContainer.appendChild(this.connectCard.getElement());
    optionsContainer.appendChild(flashCard.getElement());
    optionsContainer.appendChild(resetCard.getElement());

    container.appendChild(closeButton);
    container.appendChild(header);
    container.appendChild(optionsContainer);
    overlay.appendChild(container);
    this.node.appendChild(overlay);

    // Show the panel immediately after initialization
    console.log('Showing panel...');
    this.show();
  }

  show(): void {
    console.log('Showing panel...');
    this.node.style.display = 'block';
    this.node.classList.remove('minimized');
    this.node.classList.add('visible');
    
    // Hide the minimized button
    const minimizedButton = this.buttonContainer.querySelector('.minimized-button') as HTMLButtonElement;
    if (minimizedButton) {
      minimizedButton.style.display = 'none';
    }
    
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
      const minimizedButton = this.buttonContainer.querySelector('.minimized-button') as HTMLButtonElement;
      if (minimizedButton) {
        minimizedButton.style.display = 'flex';
      }
    }, 300);
  }
}