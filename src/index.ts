import { Widget } from '@lumino/widgets';
import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';
import { ESPLoader, FlashOptions, LoaderOptions, Transport } from 'esptool-js';
import * as CryptoJS from 'crypto-js';

// Create WelcomePanel class outside the plugin
class WelcomePanel extends Widget {
  private buttonContainer: HTMLElement;
  private firmwareBlob: Blob | null = null;
  private connected: Boolean = false;
  private firmwareString: string | null = null;

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
  }

  initUI(kernel: EchoKernel): void {
    // Add global styles including animation
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --ui-red: #FF3B30;
        --ui-red-dark: #E0321F;
        --ui-red-light: #FF6961;
        --ui-navy: #1C1C28;
        --ui-navy-light: #2D2D3A;
        --ui-white: #FFFFFF;
        --ui-gray: #8E8E93;
        --ui-gray-light: #F2F2F7;
        --ui-shadow-sm: 0 2px 8px rgba(28, 28, 40, 0.08);
        --ui-shadow-md: 0 8px 24px rgba(28, 28, 40, 0.12);
        --ui-shadow-lg: 0 20px 40px rgba(28, 28, 40, 0.16);
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      .welcome-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(28, 28, 40, 0.75);
        backdrop-filter: blur(12px) saturate(180%);
        z-index: 999;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }

      .jp-kernel-welcome-panel.visible .welcome-overlay {
        opacity: 1;
        pointer-events: all;
      }

      .welcome-dialog {
        will-change: transform, width, height, border-radius;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%);
        opacity: 0;
      }

      .jp-kernel-welcome-panel.visible .welcome-dialog {
        transform: translate(-50%, -50%);
        opacity: 1;
      }

      .jp-kernel-welcome-panel.minimizing .welcome-overlay {
        opacity: 0;
      }

      .jp-kernel-welcome-panel.minimizing .welcome-dialog {
        transform: translate(calc(100% - 60px), -20px) scale(0.2);
        border-radius: 50%;
        width: 44px;
        height: 44px;
        padding: 0;
        opacity: 1;
      }

      .minimized {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        transform: none !important;
        border-radius: 50% !important;
        width: 64px !important;
        height: 64px !important;
        padding: 0 !important;
        cursor: pointer;
        background: var(--ui-red) !important;
        border: 3px solid rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 4px 16px rgba(231, 19, 45, 0.3) !important;
        z-index: 999999999 !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        animation: float 2s infinite ease-in-out;
      }

      .minimized * {
        opacity: 0 !important;
        transition: opacity 0.2s ease;
      }

      .minimized::after {
        content: '⚡️';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        opacity: 1 !important;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
      }

      .minimized:hover {
        transform: scale(1.15) !important;
        box-shadow: 0 6px 24px rgba(231, 19, 45, 0.4) !important;
        border-color: white !important;
      }

      .minimized:active {
        transform: scale(0.95) !important;
      }

      .welcome-card {
        opacity: 0;
        transform: translateY(12px);
        animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        background: var(--ui-white) !important;
        border: 1.5px solid var(--ui-gray-light) !important;
        border-radius: 16px !important;
        padding: 1.25rem !important;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        margin-bottom: 0.75rem;
        position: relative;
        overflow: hidden;
      }

      .welcome-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(120deg, var(--ui-red), var(--ui-red-dark));
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 0;
      }

      .welcome-card:hover {
        transform: translateY(-2px) scale(1.02);
        border-color: var(--ui-red) !important;
        box-shadow: var(--ui-shadow-md),
                    0 0 0 1px var(--ui-red),
                    0 0 0 4px rgba(255, 59, 48, 0.12);
      }

      .welcome-card:hover::before {
        opacity: 1;
      }

      .welcome-card:active {
        transform: translateY(0) scale(0.98);
      }

      .card-content {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
      }

      .welcome-card:hover .welcome-icon,
      .welcome-card:hover .card-title,
      .welcome-card:hover .card-description {
        color: var(--ui-white) !important;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .welcome-card:nth-child(1) { animation-delay: 0.1s; }
      .welcome-card:nth-child(2) { animation-delay: 0.2s; }
      .welcome-card:nth-child(3) { animation-delay: 0.3s; }
      
      .welcome-icon {
        font-size: 2rem;
        margin-right: 1.25rem;
        color: var(--ui-red);
        transition: all 0.3s ease;
        text-shadow: var(--ui-shadow-sm);
      }
      
      .welcome-title {
        color: var(--ui-navy);
        font-size: 1.75rem !important;
        margin: 0 0 1.75rem !important;
        font-weight: 700;
        letter-spacing: -0.5px;
        line-height: 1.2;
      }

      .card-title {
        color: var(--ui-navy);
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 0.375rem;
        transition: color 0.3s ease;
        letter-spacing: -0.3px;
      }

      .card-description {
        color: var(--ui-gray);
        font-size: 0.9375rem;
        transition: color 0.3s ease;
        line-height: 1.4;
      }

      .close-button {
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        cursor: pointer;
        color: var(--ui-gray);
        background: var(--ui-gray-light);
        border: none;
        font-size: 1.25rem;
        padding: 0;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 0.9;
        transform-origin: center;
      }

      .close-button:hover {
        color: var(--ui-white);
        background: var(--ui-red);
        opacity: 1;
        transform: scale(1.1);
        box-shadow: var(--ui-shadow-sm);
      }

      .close-button:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);

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
        icon: '🔌',
        title: 'Connect Device',
        description: 'Connect to ESP32 device via serial',
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
        action: 'notebook',
        icon: '📓',
        title: 'Create Notebook',
        description: 'Create a new notebook for your project',
        color: 'var(--ui-navy)'
      },
      {
        action: 'reset',
        icon: '🔄',
        title: 'Reset Firmware',
        description: 'Clear firmware cache and force new download',
        color: 'var(--ui-red)'
      },
      {
        action: 'docs',
        icon: '📚',
        title: 'Documentation',
        description: 'View the documentation and examples',
        color: 'var(--ui-navy)'
      }
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

              const device = await navigator.serial.requestPort();
              const transport = new Transport(device, true);
              await transport.connect();
              kernel.transport = transport;
              this.connected = true
              
              if (this.connected) {
                connectCard.innerHTML = `
                  <div class="card-content">
                    <span class="welcome-icon">✓</span>
                    <h3>Device Connected</h3>
                    <p>Click to disconnect</p>
                  </div>
                `;
              }
            } catch (err) {

              if (connectCard) {
                connectCard.innerHTML = `
                  <div class="card-content">
                    <span class="welcome-icon">❌</span>
                    <h3>Connection Failed</h3>
                    <p>Click to try again</p>
                  </div>
                `;
              }
            }
            break;
          case 'flash':
            try {
              const portFilters: { usbVendorId?: number | undefined, usbProductId?: number | undefined }[] = [];
              const device = await navigator.serial.requestPort({ filters: portFilters });

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

              const transport = new Transport(device, true);
              let loaderOptions = {
                  transport,
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
                let result = await fetch('http://localhost:5000/ESP32_GENERIC_C3-20241129-v1.24.1.bin', {
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

              console.log('Device selected for flashing:', device);
              await transport.disconnect()
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
          case 'notebook':
            console.log('Creating new notebook...');
            break;
          case 'reset':
            try {
              // Clear cached firmware
              this.firmwareBlob = null;
              this.firmwareString = null;
              localStorage.removeItem('cachedFirmware');
              
              // Visual feedback
              const resetCard = document.querySelector(`.welcome-card[data-action="reset"]`);
              if (resetCard) {
                const originalContent = resetCard.innerHTML;
                resetCard.innerHTML = `
                  <div class="welcome-card-content" style="color: var(--ui-red)">
                    <div class="welcome-card-icon">✓</div>
                    <div class="welcome-card-title">Cache Cleared!</div>
                    <div class="welcome-card-description">Firmware will be downloaded fresh next time</div>
                  </div>
                `;
                
                // Restore original content after 2 seconds
                setTimeout(() => {
                  resetCard.innerHTML = originalContent;
                }, 2000);
              }
              
              console.log('Firmware cache cleared');
            } catch (err) {
              console.error('Failed to reset firmware cache:', err);
              
              // Show error feedback
              const resetCard = document.querySelector(`.welcome-card[data-action="reset"]`);
              if (resetCard) {
                const originalContent = resetCard.innerHTML;
                resetCard.innerHTML = `
                  <div class="welcome-card-content" style="color: var(--ui-red)">
                    <div class="welcome-card-icon">❌</div>
                    <div class="welcome-card-title">Reset Failed</div>
                    <div class="welcome-card-description">Please try again</div>
                  </div>
                `;
                
                // Restore original content after 2 seconds
                setTimeout(() => {
                  resetCard.innerHTML = originalContent;
                }, 2000);
              }
            }
            break;
          case 'docs':
            console.log('Opening documentation...');
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

// Kernel plugin for the embedded kernel
const kernelPlugin: JupyterLiteServerPlugin<void> = {
  id: 'jupyterlite-embedded-kernel:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'echo',
        display_name: 'Echo Kernel',
        language: 'text',
        argv: [],
        resources: {}
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        const kernel = new EchoKernel(options);
        // Create welcome panel
        const welcomePanel = new WelcomePanel();
        // Attach directly to document body
        Widget.attach(welcomePanel, document.body);
        // Show the panel
        welcomePanel.initUI(kernel);
        welcomePanel.show();
        await kernel.ready;
        console.log("Kernel ready")
        return kernel;
      }
    });
  }
};

export default [kernelPlugin];
