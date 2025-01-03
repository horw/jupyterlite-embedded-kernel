// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { EchoKernel } from './kernel';

/**
 * A plugin to register the echo kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/echo-kernel:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'echo',
        display_name: 'Echo',
        language: 'text',
        argv: [],
        resources: {
          'logo-32x32': '',
          'logo-64x64': ''
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        const kernel = new EchoKernel(options);

        async function connectSerialPort() {
          try {
            // Request a port and open a connection
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });

            const reader = port.readable?.getReader();
            const writer = port.writable?.getWriter();

            // Expose reader and writer to the kernel
            kernel.reader = reader;
            kernel.writer = writer;

            // Add a function to handle reading from the serial port
            // function readFromSerial() {
            //   if (reader) {
            //
            //   }
            // }

            // Periodically check for incoming data from the serial port
            // setInterval(readFromSerial, 1000);

          } catch (err) {
            console.error('Serial Port Error:', err);
          }
        }

        // Initialize the serial connection
        await connectSerialPort();

        return kernel;
      }
    });
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
