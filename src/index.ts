import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

import { ESPLoader, FlashOptions, LoaderOptions, Transport } from 'esptool-js';

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
            const firmwareUrl = 'https://micropython.org/resources/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin';

            const response = await fetch(firmwareUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch firmware: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            const device = await navigator.serial.requestPort();
            const transport = new Transport(device, true);
            let flashOptions = {
              transport,
              baudrate: 115600,
            } as LoaderOptions;
            const esploader = new ESPLoader(flashOptions);
            await esploader.main();

            let flashOptions1: FlashOptions = {
              fileArray: [{
                data: arrayBuffer,
                address: 0x0
              }],
              flashSize: "keep",
              eraseAll: false,
              compress: true,
              reportProgress: (fileIndex, written, total) => {
                console.log(total)
                console.log(fileIndex)
              },
              calculateMD5Hash: (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)),
            } as FlashOptions;
            await esploader.writeFlash(flashOptions1);
            kernel.device = esploader;
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
