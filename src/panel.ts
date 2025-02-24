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
class WelcomePanel extends Widget {
  private buttonContainer: HTMLElement;
  private styleElement: HTMLStyleElement | null = null;
  private firmwareService: FirmwareService;
  private deviceService: DeviceService;
  private connectCard: Card | null = null;

  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    this.firmwareService = FirmwareService.getInstance();
    this.deviceService = DeviceService.getInstance();

    // Try to load cached firmware
    this.firmwareService.loadCachedFirmware();

    // Create button container
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'esp-button-container';
    this.buttonContainer.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 64px;
      height: 64px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1rem;
      z-index: 999999999;
    `;
    document.body.appendChild(this.buttonContainer);

    // Initialize styles
    this.initializeStyles();
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

    // Try to connect automatically
    try {
      await this.deviceService.connect();
      kernel.transport = this.deviceService.getTransport();
      console.log('Device connected automatically');
    } catch (err) {
      console.error('Failed to connect automatically:', ErrorHandler.getErrorMessage(err));
      kernel.transport = undefined;
    }

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
    header.innerHTML = '<h1 class="welcome-title">Select an action</h1>';

    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 0.4rem;';

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
  }

  show(): void {
    this.node.classList.add('visible');
  }

  hide(): void {
    this.node.classList.remove('visible');
  }
}

export default WelcomePanel;