import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ToolbarButton } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Dialog, showDialog } from '@jupyterlab/apputils';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

// import { ESPLoader, FlashOptions, LoaderOptions, Transport } from 'esptool-js';
// import * as CryptoJS from 'crypto-js';

//
// /**
//  * Loads firmware either from file or uses default
//  */
// async function loadFirmware(): Promise<FirmwareFile> {
//   if (selectedFirmware) {
//     return selectedFirmware;
//   }
//
//   // Load default firmware as fallback
//   const firmwarePath = '/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin';
//   const response = await fetch(firmwarePath);
//   if (!response.ok) {
//     throw new Error(`Failed to load firmware: ${response.statusText}`);
//   }
//   const data = await response.arrayBuffer();
//   return {
//     name: 'ESP32_GENERIC_C3-20241129-v1.24.1.bin',
//     data
//   };
// }

/**
 * Plugin configuration for the enhanced kernel
 */
const enhancedKernel: JupyterLiteServerPlugin<void> = {
  id: 'jupyter-kernel-plugin',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const activeKernels = new Map<string, EchoKernel>();

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
        
        // Show welcome dialog
        const body = document.createElement('div');
        body.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <h2 style="margin-bottom: 15px;">Welcome to Embedded Kernel!</h2>
            <p style="font-size: 16px;">Your kernel is now ready for use.</p>
            <p style="color: #666; margin-top: 10px;">Start coding and enjoy!</p>
          </div>
        `;
        
        showDialog({
          title: 'Kernel Initialized',
          body: new Widget({ node: body }),
          buttons: [Dialog.okButton()]
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
