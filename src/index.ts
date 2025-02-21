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
      .welcome-card {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.6s ease forwards;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .welcome-card:nth-child(1) { animation-delay: 0.2s; }
      .welcome-card:nth-child(2) { animation-delay: 0.4s; }
      .welcome-card:nth-child(3) { animation-delay: 0.6s; }
      
      .welcome-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
      }
      
      .welcome-title {
        background: linear-gradient(120deg, #ff3b30, #ff9500);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 3rem !important;
        margin-bottom: 1.5rem !important;
      }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--jp-layout-color0);
      padding: 2rem;
      z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      max-width: 1200px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 3rem;
      background: var(--jp-layout-color1);
      border-radius: 24px;
      padding: 3rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    `;

    const header = document.createElement('div');
    header.innerHTML = `
      <h1 class="welcome-title" style="
        text-align: center;
        font-weight: 700;
        font-size: 3rem;
        margin: 0;
      ">Welcome to Embedded Kernel</h1>
      <p style="
        margin: 1.5rem 0;
        color: var(--jp-ui-font-color2);
        text-align: center;
        font-size: 1.4rem;
        line-height: 1.6;
      ">Get started with your embedded development journey</p>
    `;

    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      padding: 1rem;
    `;

    const options = [
      {
        action: 'flash',
        icon: '⚡',
        title: 'Flash Device',
        description: 'Upload firmware to your device securely and quickly',
        color: '#ff3b30'
      },
      {
        action: 'notebook',
        icon: '📓',
        title: 'Create Notebook',
        description: 'Start a new interactive development session',
        color: '#ff9500'
      },
      {
        action: 'help',
        icon: '💡',
        title: 'Quick Start',
        description: 'Learn the basics and best practices',
        color: '#34c759'
      }
    ];

    options.forEach(({ action, icon, title, description, color }) => {
      const card = document.createElement('div');
      card.className = 'welcome-card';
      card.innerHTML = `
        <span class="welcome-icon">${icon}</span>
        <h3 style="
          margin: 0.5rem 0;
          font-size: 1.6rem;
          font-weight: 600;
        ">${title}</h3>
        <p style="
          margin: 1rem 0;
          color: var(--jp-ui-font-color2);
          font-size: 1.1rem;
          line-height: 1.5;
        ">${description}</p>
      `;
      card.style.cssText = `
        background: var(--jp-layout-color1);
        border: 2px solid var(--jp-border-color1);
        border-radius: 16px;
        padding: 2.5rem;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        overflow: hidden;
        color: var(--jp-ui-font-color0);
        font-family: var(--jp-ui-font-family);
      `;

      card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-8px)';
        card.style.borderColor = color;
        card.style.boxShadow = `0 12px 30px ${color}33`;
      });

      card.addEventListener('mouseout', () => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });

      card.addEventListener('click', async () => {
        // Add click effect
        card.style.transform = 'scale(0.95)';
        setTimeout(() => card.style.transform = '', 150);

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
            console.log('Opening quick start guide...');
            break;
        }
      });

      optionsContainer.appendChild(card);
    });

    content.appendChild(header);
    content.appendChild(optionsContainer);
    container.appendChild(content);
    this.node.appendChild(container);
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
        await kernel.ready;
        return kernel;
      }
    });
  }
};

export default [kernelPlugin];
