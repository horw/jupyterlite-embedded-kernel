import { ESPLoader, FlashOptions, LoaderOptions, Transport } from 'esptool-js';
import { Widget } from '@lumino/widgets';
import * as CryptoJS from 'crypto-js';
import { EchoKernel } from './kernel';
import { globalStyles, animations, overlayStyles, dialogStyles, minimizedStyles, cardStyles, buttonStyles } from './styles';

// Create WelcomePanel class outside the plugin
class WelcomePanel extends Widget {
  private buttonContainer: HTMLElement;
  private firmwareBlob: Blob | null = null;
  private connected: Boolean = false;
  private transport?: Transport;
  private firmwareString: string | null = null;
  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');

    // Try to load cached firmware from localStorage
    const cachedFirmware = localStorage.getItem('cachedFirmware');
    if (cachedFirmware) {
      this.firmwareString = cachedFirmware;
      console.log('Loaded firmware from localStorage');
    }

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
    // Remove existing style element if it exists
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Create and append new style element
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

  async initUI(kernel: EchoKernel): Promise<void> {
    // Ensure styles are initialized
    this.initializeStyles();

    // Try to connect automatically
    try {
      const device = await navigator.serial.requestPort();
      const transport = new Transport(device, true);
      await transport.connect();
      kernel.transport = transport;
      this.transport = transport;
      this.connected = true;
      console.log('Device connected automatically');
    } catch (err) {
      console.error('Failed to connect automatically:', err);
      this.transport = undefined;
      kernel.transport = undefined;
      this.connected = false;
    }

    // Add styles for progress bar
    const progressBarStyle = document.createElement('style');
    progressBarStyle.textContent = `
      :root {
        --ui-white: #ffffff;
        --ui-red: #E31B23;
        --ui-navy: #1c1c28;
        --ui-shadow-sm: 0 2px 8px rgba(28, 28, 40, 0.08);
        --ui-shadow-md: 0 8px 16px rgba(28, 28, 40, 0.12);
        --ui-shadow-lg: 0 20px 40px rgba(28, 28, 40, 0.16);
      }

      .progress-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .progress-overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .progress-container {
        background: var(--ui-white);
        border-radius: 16px;
        padding: 2rem;
        width: 400px;
        box-shadow: var(--ui-shadow-lg);
      }

      .progress-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--ui-navy);
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: rgba(227, 27, 35, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-bar {
        width: 0%;
        height: 100%;
        background: var(--ui-red);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-status {
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: var(--ui-navy);
        opacity: 0.7;
      }
    `;
    document.head.appendChild(progressBarStyle);

    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    const container = document.createElement('div');
    container.className = 'welcome-dialog';
    container.style.cssText = `
      z-index: 1000;
      background: var(--ui-white);
      border-radius: 24px;
      box-shadow: var(--ui-shadow-lg),
                  0 0 0 1px rgba(28, 28, 40, 0.04);
      width: 380px;
      padding: 2rem;
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => this.hide());

    const header = document.createElement('div');
    header.innerHTML = `
      <h1 class="welcome-title">Select an action</h1>
    `;

    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    `;

    const cards = [
      {
        action: 'connect',
        icon: this.connected ? '✓' : '🔌',
        title: this.connected ? 'Device Connected' : 'Connect Device',
        description: this.connected ? 'Click to disconnect' : 'Connect to ESP32 device via serial',
        color: 'var(--ui-navy)'
      },
      {
        action: 'flash',
        icon: '⚡️',
        title: 'Flash Device',
        description: 'Flash your device with the latest firmware',
        color: 'var(--ui-red)'
      },
      {
        action: 'reset-esp',
        icon: '🔄',
        title: 'Hard reset Esp',
        description: 'Hard reset esp chip',
        color: 'var(--ui-red)'
      },
    ];

    cards.forEach(({ action, icon, title, description, color }) => {
      const card = document.createElement('div');
      card.className = 'welcome-card';
      card.setAttribute('data-action', action);
      card.innerHTML = `
        <div class="card-content">
          <span class="welcome-icon">${icon}</span>
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      `;

      card.addEventListener('click', async () => {
        switch (action) {
          case 'connect':
            try {
              const connectCard = document.querySelector(`.welcome-card[data-action="connect"]`);

              if (!this.connected) {
                // Connect to device
                const device = await navigator.serial.requestPort();
                const transport = new Transport(device, true);
                await transport.connect();
                kernel.transport = transport;
                this.transport = transport;
                this.connected = true;
              } else {
                // Disconnect from device
                await this.transport?.disconnect();
                kernel.transport = undefined;
                this.transport = undefined;
                this.connected = false;
              }

              // Update UI based on connection state
              if (connectCard) {
                if (this.connected) {
                  connectCard.innerHTML = `
                    <div class="card-content">
                      <span class="welcome-icon">✓</span>
                      <h3>Device Connected</h3>
                      <p>Click to disconnect</p>
                    </div>
                  `;
                } else {
                  connectCard.innerHTML = `
                    <div class="card-content">
                      <span class="welcome-icon">🔌</span>
                      <h3>Connect Device</h3>
                      <p>Connect to ESP32 device via serial</p>
                    </div>
                  `;
                }
              }
            } catch (err) {
              console.error('Connection error:', err);
              const connectCard = document.querySelector(`.welcome-card[data-action="connect"]`);
              if (connectCard) {
                connectCard.innerHTML = `
                  <div class="card-content">
                    <span class="welcome-icon">❌</span>
                    <h3>Connection Failed</h3>
                    <p>Click to try again</p>
                  </div>
                `;
              }
              // Reset state on error
              this.transport = undefined;
              kernel.transport = undefined;
              this.connected = false;
            }
            break;
          case 'flash':
            console.log("Trying to flash device")
            console.log(this.transport)
            try {
              if (this.transport==undefined){
                return
              }

              console.log("Trying to disconnect")
              await this.transport.disconnect()
              console.log("Disconnected")

              const device = await navigator.serial.requestPort();
              const transport = new Transport(device, true);
              // Create progress overlay
              const progressOverlay = document.createElement('div');
              progressOverlay.className = 'progress-overlay';
              progressOverlay.innerHTML = `
                <div class="progress-container">
                  <div class="progress-title">Flashing Firmware...</div>
                  <div class="progress-bar-container">
                    <div class="progress-bar"></div>
                  </div>
                  <div class="progress-status">Initializing...</div>
                </div>
              `;
              document.body.appendChild(progressOverlay);

              // Show progress overlay
              requestAnimationFrame(() => {
                progressOverlay.classList.add('visible');
              });

              let loaderOptions = {
                transport: transport,
                baudrate: 115600,
              } as LoaderOptions;
              const esploader = new ESPLoader(loaderOptions);

              // Update status
              const statusEl = progressOverlay.querySelector('.progress-status') as HTMLElement;
              statusEl.textContent = 'Connecting to device...';

              await esploader.main();

              // Use cached firmware if available, otherwise fetch it
              if (!this.firmwareString) {
                statusEl.textContent = 'Downloading firmware...';
                let result = await fetch('https://horw.github.io/buffer/ESP32_GENERIC_C3-20241129-v1.24.1.bin', {
                  mode: 'cors',
                  headers: {
                    'Accept': 'application/octet-stream',
                  }
                });

                if (!result.ok) {
                  throw new Error(`Failed to fetch firmware: ${result.status} ${result.statusText}`);
                }

                // Store the firmware as blob and string
                this.firmwareBlob = await result.blob();
                const uint8Array = new Uint8Array(await this.firmwareBlob.arrayBuffer());
                this.firmwareString = Array.from(uint8Array)
                  .map(byte => String.fromCharCode(byte))
                  .join('');

                // Cache in localStorage
                try {
                  localStorage.setItem('cachedFirmware', this.firmwareString);
                  console.log('Firmware cached in localStorage');
                } catch (e) {
                  console.warn('Failed to cache firmware in localStorage:', e);
                }
              } else {
                console.log('Using cached firmware');
              }

              let flashOptions1: FlashOptions = {
                fileArray: [{
                  data: this.firmwareString,
                  address: 0x0
                }],
                flashSize: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex, written, total) => {
                  const progress = (written / total) * 100;
                  const progressBar = progressOverlay.querySelector('.progress-bar') as HTMLElement;
                  const statusEl = progressOverlay.querySelector('.progress-status') as HTMLElement;

                  progressBar.style.width = `${progress}%`;
                  statusEl.textContent = `Flashing: ${Math.round(progress)}% (${written} / ${total} bytes)`;

                  console.log('Flash progress:', {fileIndex, written, total});
                },
                calculateMD5Hash: (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString(),
              } as FlashOptions;

              await esploader.writeFlash(flashOptions1);

              // Show completion for a moment
              statusEl.textContent = 'Flash complete!';
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Hide and remove progress overlay
              progressOverlay.classList.remove('visible');
              await new Promise(resolve => setTimeout(resolve, 300));
              progressOverlay.remove();

              await transport.setDTR(false);
              await new Promise((resolve) => setTimeout(resolve, 100));
              await transport.setDTR(true);

              await transport.disconnect()
              await this.transport.connect()

            } catch (err) {
              console.error('Failed to get serial port:', err);

              // Show error in progress overlay if it exists
              const progressOverlay = document.querySelector('.progress-overlay');
              if (progressOverlay) {
                const statusEl = progressOverlay.querySelector('.progress-status') as HTMLElement;
                const titleEl = progressOverlay.querySelector('.progress-title') as HTMLElement;

                titleEl.textContent = 'Error';
                titleEl.style.color = 'var(--ui-red)';
                statusEl.textContent = 'Failed to flash device';

                // Hide after 3 seconds
                setTimeout(() => {
                  progressOverlay.classList.remove('visible');
                  setTimeout(() => progressOverlay.remove(), 300);
                }, 3000);
              }
            }
            break;
          case 'reset-esp':
            if (this.transport == undefined){
              break;
            }
            await this.transport.setDTR(false);
            await new Promise((resolve) => setTimeout(resolve, 100));
            await this.transport.setDTR(true);
            console.log("Device was reset.");
            break;
        }
        this.hide();
      });

      optionsContainer.appendChild(card);
    });

    container.appendChild(closeButton);
    container.appendChild(header);
    container.appendChild(optionsContainer);
    overlay.appendChild(container);

    // Create a container for the minimized button that will always be on top
    // Create Espressif logo using direct URL
    const espressifLogo = `
      <img src="https://www.cdnlogo.com/logos/e/41/espressif-systems.svg" 
           alt="Espressif Logo"
           style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1);">
    `;

    // Create the circle button
    const circleButton = document.createElement('button');
    circleButton.className = 'minimized-button';
    circleButton.innerHTML = espressifLogo;
    circleButton.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.9);
      background: var(--ui-red);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      padding-top: 6px;
      box-shadow: 0 4px 16px rgba(231, 19, 45, 0.3);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      animation: float 2s infinite ease-in-out;
      overflow: hidden;
    `;

    // Add hover and click effects with logo rotation
    circleButton.addEventListener('mouseover', () => {
      circleButton.style.transform = 'scale(1.15)';
      circleButton.style.boxShadow = '0 6px 24px rgba(231, 19, 45, 0.4)';
      circleButton.style.borderColor = 'white';
      const img = circleButton.querySelector('img');
      if (img) {
        img.style.transform = 'rotate(30deg)';
      }
    });

    circleButton.addEventListener('mouseout', () => {
      circleButton.style.transform = 'none';
      circleButton.style.boxShadow = '0 4px 16px rgba(231, 19, 45, 0.3)';
      circleButton.style.borderColor = 'rgba(255, 255, 255, 0.9)';
      const img = circleButton.querySelector('img');
      if (img) {
        img.style.transform = 'none';
      }
    });

    circleButton.addEventListener('mousedown', () => {
      circleButton.style.transform = 'scale(0.95)';
    });

    circleButton.addEventListener('mouseup', () => {
      circleButton.style.transform = 'scale(1.15)';
    });

    circleButton.addEventListener('click', () => {
      this.show();
    });

    // Add SVG transition styles
    const svgStyle = document.createElement('style');
    svgStyle.textContent += `
      .minimized-button img {
        width: 100%;
        height: 100%;
        transition: transform 0.3s ease;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `;
    document.head.appendChild(svgStyle);

    this.buttonContainer.appendChild(circleButton);
    document.body.appendChild(this.buttonContainer);

    this.node.appendChild(overlay);

    // Add keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasClass('visible')) {
        this.hide();
      }
    });

    // Add click handler for minimized state
    container.addEventListener('click', (e) => {
      if (container.classList.contains('minimized')) {
        this.show();
      }
    });
  }

  show(): void {
    this.buttonContainer.style.display = 'none';
    this.addClass('visible');
  }

  hide(): void {
    this.addClass('minimizing');
    // First animate to the corner
    setTimeout(() => {
      this.removeClass('visible');
      this.removeClass('minimizing');
      this.buttonContainer.style.display = 'block';
      this.buttonContainer.style.bottom = '20px';
      this.buttonContainer.style.right = '20px';
    }, 400);
  }
}
export default WelcomePanel;