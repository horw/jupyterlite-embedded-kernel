import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IStatusBar } from '@jupyterlab/statusbar';
import { Widget } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

// Create WelcomePanel class outside the plugin
class WelcomePanel extends Widget {
  constructor(kernel: IKernel) {
    super();
    this.id = 'kernel-welcome-panel';
    this.addClass('jp-kernel-welcome-panel');
    this.initUI(kernel);
  }

  private initUI(kernel: IKernel): void {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--jp-layout-color0);
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

/**
 * Plugin configuration for the enhanced kernel
 */
const enhancedKernel: JupyterLiteServerPlugin<void> = {
  id: 'jupyter-kernel-plugin',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const activeKernels = new Map<string, EchoKernel>();

    // Function to handle different actions
    async function handleKernelAction(action: string, kernel: EchoKernel): Promise<void> {
      switch(action) {
        case 'flash':
          try {
            const device = await navigator.serial.requestPort();
            console.log('Device selected for flashing:', device);
          } catch (err) {
            console.error('Failed to get serial port:', err);
          }
          break;
        
        case 'notebook':
          try {
            console.log('Creating new notebook with kernel:', kernel.id);
            // Add your notebook creation logic here
          } catch (err) {
            console.error('Failed to create notebook:', err);
          }
          break;
        
        case 'help':
          try {
            console.log('Opening help documentation');
            window.open('https://github.com/your-repo/docs', '_blank');
          } catch (err) {
            console.error('Failed to open help:', err);
          }
          break;
      }
    }

    app.router.post('/api/kernels/(.*)/interrupt', async (req, kernelId: string) => {
      const kernel = activeKernels.get(kernelId);
      if (kernel) {
        try {
          await kernel.interrupt();
          return new Response(null, { status: 204 });
        } catch (error) {
          console.error('Failed to interrupt kernel:', error);
          return new Response('Failed to interrupt kernel', { status: 500 });
        }
      }
      return new Response('Kernel not found', { status: 404 });
    });

    kernelspecs.register({
      spec: {
        name: 'embedded',
        display_name: 'Embedded Kernel',
        language: 'python',
        argv: [],
        resources: {
          'logo-32x32': 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg',
          'logo-64x64': 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg',
        },
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        const kernel = new EchoKernel(options);
        
        // Create custom welcome panel
        const welcomePanel = new WelcomePanel(kernel);
        app.shell.add(welcomePanel, 'main', { mode: 'split-right' });
        
        await kernel.ready;
        return kernel;
      },
    });

    console.log('Embedded kernel plugin activated');
  },
};

/**
 * Activates the Frontier status bar plugin
 */
function activateFrontier(
  app: JupyterFrontEnd
): IStatusBar {
  // Create a status bar item widget
  class FrontierStatus extends Widget {
    constructor() {
      super();
      this.addClass('jp-Frontier-StatusItem');
      
      // Add custom styles
      const style = document.createElement('style');
      style.textContent = `
        .jp-Frontier-StatusItem {
          display: flex;
          align-items: center;
          padding: 0 12px;
          color: var(--jp-ui-font-color1);
          background-color: var(--jp-layout-color1);
          height: 24px;
          transition: background-color 0.2s ease;
        }
        .jp-Frontier-StatusItem:hover {
          background-color: var(--jp-layout-color2);
        }
        .jp-Frontier-StatusItem.active {
          background-color: var(--jp-brand-color1);
          color: white;
        }
      `;
      document.head.appendChild(style);

      // Create button with icon
      const button = new ToolbarButton({
        icon: 'fa-rocket',
        onClick: () => {
          this.toggleActive();
          console.log('Frontier status clicked!');
        },
        tooltip: 'Frontier Status'
      });

      this.node.appendChild(button.node);
    }

    private toggleActive(): void {
      this.toggleClass('active');
    }
  }

  const statusBar: IStatusBar = {
    registerStatusItem: (id: string, statusItem: IStatusBar.IItem) => {
      let _isDisposed = false;
      
      // Create a new instance for each registration
      const widget = new FrontierStatus();
      widget.id = id;
      
      // If this is our own registration, show the widget
      if (id === 'frontier-status') {
        statusItem.item = widget;
      }
      
      return {
        dispose: () => { 
          widget.dispose();
          _isDisposed = true;
        },
        get isDisposed(): boolean {
          return _isDisposed;
        }
      };
    }
  };

  return statusBar;
}

const userPlugin: JupyterFrontEndPlugin<IStatusBar> = {
  id: "Frontier",
  autoStart: true,
  activate: activateFrontier,
  provides: IStatusBar
};

/**
 * A simple frontend plugin that activates with JupyterLab
 */
const frontendPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlite-embedded-kernel:frontend',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab frontend plugin activated!');
  }
};

export default [enhancedKernel, userPlugin, frontendPlugin];
