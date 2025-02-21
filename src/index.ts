import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ToolbarButton, Dialog, showDialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

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
        
        // Create custom dialog body with buttons
        class CustomDialogBody extends Widget {
          constructor(private readonly onAction: (action: string) => void) {
            super();
            this.addClass('jp-Dialog-body');
            
            const container = document.createElement('div');
            container.style.cssText = `
              padding: 2rem;
              min-width: 600px;
              min-height: 400px;
              display: flex;
              flex-direction: column;
              gap: 2rem;
            `;

            const header = document.createElement('div');

            const optionsContainer = document.createElement('div');
            optionsContainer.style.cssText = `
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1.5rem;
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
              const button = document.createElement('button');
              button.className = 'option-button';
              button.dataset.action = action;
              button.innerHTML = `
                <span style="font-size: 2rem;">${icon}</span>
                <h3 style="margin: 0.5rem 0; font-size: 1.3rem;">${title}</h3>
                <p style="margin: 0; color: var(--jp-ui-font-color2);">${description}</p>
              `;
              button.style.cssText = `
                background: var(--jp-layout-color1);
                border: 2px solid var(--jp-border-color1);
                border-radius: 12px;
                padding: 1.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                width: 100%;
                height: 100%;
                min-height: 180px;
                color: var(--jp-ui-font-color0);
                font-family: var(--jp-ui-font-family);
              `;

              optionsContainer.appendChild(button);
            });

            // Add hover effects
            container.querySelectorAll('.option-button').forEach(button => {
              button.addEventListener('mouseover', () => {
                (button as HTMLElement).style.transform = 'translateY(-5px)';
                (button as HTMLElement).style.borderColor = '#ff3b30';
                (button as HTMLElement).style.boxShadow = '0 8px 24px rgba(255, 59, 48, 0.2)';
              });

              button.addEventListener('mouseout', () => {
                (button as HTMLElement).style.transform = '';
                (button as HTMLElement).style.borderColor = '';
                (button as HTMLElement).style.boxShadow = '';
              });

              button.addEventListener('click', () => {
                const action = (button as HTMLElement).dataset.action;
                if (action) {
                  this.onAction(action);
                  Dialog.flush();
                }
              });
            });

            container.appendChild(header);
            container.appendChild(optionsContainer);
            this.node.appendChild(container);
          }
        }

        // Show the custom dialog and handle the action
        showDialog({
          title: 'Embedded Kernel Options',
          body: new CustomDialogBody((action: string) => {
            handleKernelAction(action, kernel);
          }),
          buttons: [] // We're using custom buttons in the body
        });

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
