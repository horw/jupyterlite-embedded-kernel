import { Widget } from '@lumino/widgets';
import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

// Create WelcomePanel class outside the plugin
class WelcomePanel extends Widget {
  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    this.initUI();
  }

  private initUI(): void {
    // Add global styles
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

      .jp-kernel-welcome-panel {
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .jp-kernel-welcome-panel.visible {
        display: block;
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
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -56%);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        background: var(--ui-white);
        border-radius: 24px;
        box-shadow: var(--ui-shadow-lg),
                    0 0 0 1px rgba(28, 28, 40, 0.04);
        width: 380px;
        padding: 2rem;
      }

      .jp-kernel-welcome-panel.visible .welcome-dialog {
        transform: translate(-50%, -50%);
        opacity: 1;
      }

      .jp-kernel-welcome-panel.hiding .welcome-overlay {
        opacity: 0;
      }

      .jp-kernel-welcome-panel.hiding .welcome-dialog {
        opacity: 0;
        transform: translate(-50%, -44%);
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
    this.node.appendChild(overlay);

    // Add keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasClass('visible')) {
        this.hide();
      }
    });
  }

  show(): void {
    this.addClass('visible');
  }

  hide(): void {
    this.addClass('hiding');
    setTimeout(() => {
      this.removeClass('visible');
      this.removeClass('hiding');
    }, 400); // Match the transition duration
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
