import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

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
        activeKernels.set(kernel.id, kernel);

        async function connectSerialPort() {
          try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            await port.setSignals({ dataTerminalReady: false });
            await new Promise((resolve) => setTimeout(resolve, 200));
            await port.setSignals({ dataTerminalReady: true });

            const reader = port.readable?.getReader();
            const writer = port.writable?.getWriter();

            kernel.reader = reader;
            kernel.writer = writer;
            kernel.port = port;
          } catch (err) {
            console.error('Serial Port Error:', err);
          }
        }
        await connectSerialPort();
        console.log('Creating embedded kernel instance');
        await kernel.ready;
        return kernel;
      },
    });

    console.log('Embedded kernel plugin activated');
  },
};

const plugins: JupyterLiteServerPlugin<any>[] = [enhancedKernel];

export default plugins;
