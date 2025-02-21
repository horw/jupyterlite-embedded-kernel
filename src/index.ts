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
            // Add your flashing logic here
            // You can access kernel.device or other properties as needed
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
            container.style.padding = '20px';
            container.innerHTML = `
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin-bottom: 15px;">Welcome to Embedded Kernel!</h2>
                <p style="font-size: 16px;">Please choose an option to continue:</p>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="jp-Dialog-button jp-mod-accept jp-mod-styled" data-action="flash">
                  🔌 Flash Device
                  <span style="display: block; font-size: 12px; color: #666;">
                    Connect and flash your device with firmware
                  </span>
                </button>
                <button class="jp-Dialog-button jp-mod-accept jp-mod-styled" data-action="notebook">
                  📓 Open Notebook
                  <span style="display: block; font-size: 12px; color: #666;">
                    Start coding with a new notebook
                  </span>
                </button>
                <button class="jp-Dialog-button jp-mod-accept jp-mod-styled" data-action="help">
                  ❓ Show Help
                  <span style="display: block; font-size: 12px; color: #666;">
                    View documentation and examples
                  </span>
                </button>
              </div>
            `;

            // Add click handlers
            container.querySelectorAll('button').forEach(button => {
              button.addEventListener('click', (e) => {
                const action = (e.currentTarget as HTMLElement).dataset.action;
                if (action) {
                  this.onAction(action);
                  Dialog.flush();
                }
              });
            });

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
