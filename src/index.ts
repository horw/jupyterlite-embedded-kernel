import { JupyterLiteServer, JupyterLiteServerPlugin } from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';
import { EchoKernel } from './kernel';

import { ESPLoader, FlashOptions, LoaderOptions, Transport } from 'esptool-js';
import * as CryptoJS from 'crypto-js';
import { MICROPYTHON_FIRMWARE } from './firmware';

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

        try {
          // Request serial port access
          const device = await navigator.serial.requestPort();
          const transport = new Transport(device, true);
          
          // Initialize ESP loader
          let loaderOptions = {
              transport,
              baudrate: 115600,
            } as LoaderOptions;
          const esploader = new ESPLoader(loaderOptions);
          await esploader.main();
          
          // Use local firmware data
          const arrayBuffer = MICROPYTHON_FIRMWARE.data;
          console.log('Firmware size:', arrayBuffer.byteLength);
          
          // Convert ArrayBuffer to string
          const uint8Array = new Uint8Array(arrayBuffer);
          const firmwareString = Array.from(uint8Array)
            .map(byte => String.fromCharCode(byte))
            .join('');

          let flashOptions1: FlashOptions = {
            fileArray: [{
              data: firmwareString,
              address: 0x0
            }],
            flashSize: "keep",
            eraseAll: false,
            compress: true,
            reportProgress: (fileIndex, written, total) => {
              console.log('Flash progress:', {fileIndex, written, total})
            },
            calculateMD5Hash: (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString(),
          } as FlashOptions;

          await esploader.writeFlash(flashOptions1);
          kernel.device = esploader;
          console.log('MicroPython successfully flashed');
        } catch (err) {
          console.error('Failed to initialize kernel:', err);
          throw err;
        }

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
