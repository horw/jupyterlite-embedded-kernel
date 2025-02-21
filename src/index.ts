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
      .jp-kernel-welcome-panel {
        display: none;
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
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(2px);
        z-index: 999;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .jp-kernel-welcome-panel.visible .welcome-overlay {
        opacity: 1;
      }

      .welcome-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%);
        opacity: 0;
        transition: all 0.3s ease;
      }

      .jp-kernel-welcome-panel.visible .welcome-dialog {
        transform: translate(-50%, -50%);
        opacity: 1;
      }

      .welcome-card {
        opacity: 0;
        transform: translateY(10px);
        animation: fadeInUp 0.4s ease forwards;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
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
        font-size: 1.5rem;
        margin-right: 1rem;
        opacity: 0.8;
      }
      
      .welcome-title {
        color: var(--jp-ui-font-color0);
        font-size: 1.1rem !important;
        margin: 0 0 1rem !important;
        font-weight: 500;
        opacity: 0.9;
      }

      .close-button {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        cursor: pointer;
        color: var(--jp-ui-font-color2);
        background: none;
        border: none;
        font-size: 1.2rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s ease;
        opacity: 0.6;
      }

      .close-button:hover {
        color: var(--jp-ui-font-color0);
        background: var(--jp-layout-color2);
        opacity: 1;
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
      background: var(--jp-layout-color1);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 360px;
      padding: 1.25rem;
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
        color: 'var(--jp-warn-color1)'
      },
      {
        action: 'notebook',
        icon: '📝',
        title: 'New Notebook',
        description: 'Create development session',
        color: 'var(--jp-info-color1)'
      },
      {
        action: 'help',
        icon: '📚',
        title: 'Documentation',
        description: 'View guides and reference',
        color: 'var(--jp-brand-color1)'
      }
    ];

    options.forEach(({ action, icon, title, description, color }) => {
      const card = document.createElement('div');
      card.className = 'welcome-card';
      card.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span class="welcome-icon">${icon}</span>
          <div>
            <div style="
              font-weight: 500;
              color: var(--jp-ui-font-color0);
              font-size: 0.95rem;
            ">${title}</div>
            <div style="
              color: var(--jp-ui-font-color2);
              font-size: 0.85rem;
              opacity: 0.8;
            ">${description}</div>
          </div>
        </div>
      `;
      card.style.cssText = `
        background: var(--jp-layout-color2);
        border: 1px solid var(--jp-border-color1);
        border-radius: 4px;
        padding: 0.7rem 0.75rem;
        cursor: pointer;
        transition: all 0.15s ease;
      `;

      card.addEventListener('mouseover', () => {
        card.style.background = 'var(--jp-layout-color3)';
        card.style.borderColor = color;
      });

      card.addEventListener('mouseout', () => {
        card.style.background = 'var(--jp-layout-color2)';
        card.style.borderColor = 'var(--jp-border-color1)';
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
    this.removeClass('visible');
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
