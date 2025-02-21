import { Widget } from '@lumino/widgets';
import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

// Create WelcomePanel class outside the plugin
class WelcomePanel extends Widget {
  private buttonContainer: HTMLElement;

  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    
    // Initialize buttonContainer
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 64px;
      height: 64px;
      z-index: 999999999;
    `;
    document.body.appendChild(this.buttonContainer);
    
    this.initUI();
  }

  private initUI(): void {
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

    const options = [
      {
        action: 'flash',
        icon: '🔌',
        title: 'Flash Device',
        description: 'Upload firmware to your device',
        color: 'var(--ui-red)'
      },
      {
        action: 'notebook',
        icon: '📝',
        title: 'New Notebook',
        description: 'Create development session',
        color: 'var(--ui-navy)'
      },
      {
        action: 'help',
        icon: '📚',
        title: 'Documentation',
        description: 'View guides and reference',
        color: 'var(--ui-navy)'
      }
    ];

    options.forEach(({ action, icon, title, description, color }) => {
      const card = document.createElement('div');
      card.className = 'welcome-card';
      card.innerHTML = `
        <div class="card-content">
          <span class="welcome-icon">${icon}</span>
          <div>
            <div class="card-title">${title}</div>
            <div class="card-description">${description}</div>
          </div>
        </div>
      `;
      card.style.cssText = `
        background: var(--ui-white) !important;
        border: 1.5px solid var(--ui-gray-light) !important;
        border-radius: 16px !important;
        padding: 1.25rem !important;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        margin-bottom: 0.75rem;
      `;

      card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-2px) scale(1.02)';
        card.style.borderColor = 'var(--ui-red)';
        card.style.boxShadow = 'var(--ui-shadow-md), 0 0 0 1px var(--ui-red), 0 0 0 4px rgba(255, 59, 48, 0.12)';
      });

      card.addEventListener('mouseout', () => {
        card.style.transform = '';
        card.style.borderColor = 'var(--ui-gray-light)';
        card.style.boxShadow = '';
      });

      card.addEventListener('click', async () => {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => card.style.transform = '', 100);

        switch (action) {
          case 'flash':
            try {
              const device = await navigator.serial.requestPort();
              console.log('Device selected for flashing:', device);
            } catch (err) {
              console.error('Failed to get serial port:', err);
            }
            break;
          case 'notebook':
            console.log('Creating new notebook...');
            break;
          case 'help':
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
        welcomePanel.show();
        await kernel.ready;
        return kernel;
      }
    });
  }
};

export default [kernelPlugin];
