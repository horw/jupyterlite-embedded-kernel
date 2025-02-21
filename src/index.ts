import { Widget } from '@lumino/widgets';
import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

// Constants

// Create WelcomePanel class outside the plugin
class WelcomePanel extends Widget {
  constructor() {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    this.initUI();
  }

  private initUI(): void {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--jp-layout-color0);
      z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      padding: 2rem;
      max-width: 900px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    `;

    const header = document.createElement('div');
    header.innerHTML = `
      <h1 style="
        margin: 0;
        font-size: 2.5rem;
        color: var(--jp-ui-font-color0);
        text-align: center;
        font-weight: 600;
      ">Welcome to Embedded Kernel</h1>
      <p style="
        margin: 1rem 0;
        color: var(--jp-ui-font-color2);
        text-align: center;
        font-size: 1.2rem;
      ">Choose an action to get started with your embedded development</p>
    `;

    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      padding: 1rem;
    `;

    const options = [
      {
        action: 'flash',
        icon: '🔧',
        title: 'Flash Device',
        description: 'Upload firmware to your device'
      },
      {
        action: 'notebook',
        icon: '📓',
        title: 'Open Notebook',
        description: 'Start working with your device'
      },
      {
        action: 'help',
        icon: '❓',
        title: 'Show Help',
        description: 'Learn more about embedded development'
      }
    ];

    options.forEach(({ action, icon, title, description }) => {
      const card = document.createElement('div');
      card.className = 'welcome-card';
      card.innerHTML = `
        <span style="font-size: 2.5rem;">${icon}</span>
        <h3 style="margin: 0.5rem 0; font-size: 1.4rem;">${title}</h3>
        <p style="margin: 0; color: var(--jp-ui-font-color2);">${description}</p>
      `;
      card.style.cssText = `
        background: var(--jp-layout-color1);
        border: 2px solid var(--jp-border-color1);
        border-radius: 12px;
        padding: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: 200px;
        color: var(--jp-ui-font-color0);
        font-family: var(--jp-ui-font-family);
      `;

      card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.borderColor = '#ff3b30';
        card.style.boxShadow = '0 8px 24px rgba(255, 59, 48, 0.2)';
      });

      card.addEventListener('mouseout', () => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });

      card.addEventListener('click', async () => {
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
            // Handle notebook creation
            console.log('Creating new notebook...');
            break;
          case 'help':
            // Open help documentation
            console.log('Opening help documentation...');
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

export default [ kernelPlugin];
