import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { ESPLoader, FlashOptions, LoaderOptions, Transport } from 'esptool-js';


/**
 * A kernel that handles MicroPython flashing and serial communication
 */
export class EchoKernel extends BaseKernel {
  public reader?: ReadableStreamDefaultReader<Uint8Array>;
  public writer?: WritableStreamDefaultWriter<Uint8Array>;
  public device?: SerialPort;
  public esploader?: ESPLoader;
  private blocker: Promise<void> | null = null;
  private blockerResolve: (() => void) | null = null;
  private first_run = true;

  private setBlocked(blocked: boolean): void {
    if (blocked && !this.blocker) {
      this.blocker = new Promise((resolve) => {
        this.blockerResolve = resolve;
      });
    } else if (!blocked && this.blockerResolve) {
      this.blockerResolve();
      this.blocker = null;
      this.blockerResolve = null;
    }
  }

  async interrupt(): Promise<void> {
    if (this.writer) {
      const ctrl_c = new Uint8Array([3]);
      const encoder = new TextEncoder();
      const new_line = encoder.encode('\r\n');
      await this.writer.write(ctrl_c);
      await this.writer.write(new_line);
    }
  }

  private streamOutput(output: string) {
    this.stream({
      text: output,
      name: 'stdout',
    });
  }

  async readWithTimeout(
    timeoutMs: number = 500,
  ): Promise<Uint8Array | null | undefined> {
    if (!this.reader) {
      return null;
    }
    const result = await this.reader.read();
    return result.value;
  }

  public async read_loop() {
    let outputBuffer = '';
    const sendInterval = 500;

    const sendData = () => {
      if (outputBuffer) {
        this.streamOutput(outputBuffer);
        console.log(outputBuffer);
        outputBuffer = '';
      }
    };
    const intervalId = setInterval(sendData, sendInterval);

    try {
      while (this.reader) {
        const value = await this.readWithTimeout();
        if (!value) {
          continue;
        }

        const data = new TextDecoder().decode(value);
        console.log('Current buffer before: ', outputBuffer);
        outputBuffer += data;
        console.log('Data: ', data);
        console.log('Current buffer after: ', outputBuffer);
        if (data.includes('>>>')) {
          this.setBlocked(false);
        }
      }
    } finally {
      clearInterval(intervalId);
      sendData();
    }
  }

  private async waitForPrompt(): Promise<void> {
    if (this.blocker) {
      await this.blocker;
    }
  }

  /**
   * Flash MicroPython to the connected ESP device
   */
  async flashMicroPython(firmwareUrl: string): Promise<void> {
    try {
      // Request port access with filters for ESP32-C3
      const portFilters = [
        // ESP32-C3 common USB IDs
        { usbVendorId: 0x303A, usbProductId: 0x1001 },  // ESP32-C3 default
        { usbVendorId: 0x10C4, usbProductId: 0xEA60 },  // CP2102 USB-to-UART
        { usbVendorId: 0x1A86, usbProductId: 0x7523 }   // CH340 USB-to-UART
      ];

      this.streamOutput('Please select your ESP32-C3 device...\n');

      if (!this.device) {
        console.log("Requesting port");
        this.device = await navigator.serial.requestPort({ filters: portFilters });
      }
      console.log("123")
      var transport = new Transport(this.device, true);

      console.log("TR port");
      const flashOptions = {
        transport,
        baudrate: 115600,
      } as LoaderOptions;
      var esploader = new ESPLoader(flashOptions);
      console.log("START")
      var chip = await esploader.main();
  
      // Temporarily broken
      // await esploader.flashId();
      console.log("Settings done for :" + chip);

    //   if (!this.device) {
    //     throw new Error('Failed to get serial port access');
    //   }

    //   // Initialize ESPLoader with updated options
    //   const loaderOptions: ESPLoaderOptions = {
    //     transport: Transport.SERIAL,
    //     baudrate: 115200,
    //     serialPort: this.device
    //   };
      
      try {
        // Connect and identify the chip
        this.streamOutput('Connected to ESP32-C3\n');

        const response = await fetch(firmwareUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch firmware: ${response.statusText}`);
        }
        const firmware = await response.arrayBuffer();

        // Flash the firmware with flash options
        this.streamOutput('Starting to flash MicroPython...\n');
        const flashOptions: FlashOptions = {
          fileArray: [{
            data: Buffer.from(firmware).toString('base64'),
            address: 0x0
          }],
          flashSize: '4MB',  // Common size for ESP32-C3
          flashMode: 'DIO',  // Default flash mode
          flashFreq: '40MHz', // Common frequency
          eraseAll: true,    // Ensure clean flash
          compress: true,    // Enable compression
          reportProgress: (fileIndex: number, written: number, total: number) => {
            const progress = (written / total) * 100;
            this.streamOutput(`Flashing progress: ${Math.round(progress)}% (${written}/${total} bytes)\n`);
          }
        };
        
        await esploader.writeFlash(flashOptions);  // Changed to writeFlash method
        this.streamOutput('MicroPython flashed successfully!\n');

        // Reset the device
        this.streamOutput('Device reset complete\n');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.streamOutput(`Error during flashing: ${errorMessage}\n`);
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.streamOutput(`Error during flashing: ${errorMessage}\n`);
      throw error;
    }
  }

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content'],
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    this.setBlocked(true);
    if (this.first_run) {
      this.read_loop();
      this.first_run = false;
    }

    const { code } = content;

    if (code.startsWith('%%flash_micropython')) {
      const url = code.split('\n')[1].trim();
      if (!url) {
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Missing MicroPython firmware URL',
          traceback: ['Please provide MicroPython firmware URL']
        };
      }
      
      try {
        await this.flashMicroPython(url);
        return {
          status: 'ok',
          execution_count: this.executionCount,
          user_expressions: {},
          payload: []
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'FlashError',
          evalue: errorMessage,
          traceback: [`Error flashing MicroPython: ${errorMessage}`]
        };
      }
    }

    const encoder = new TextEncoder();
    const ctrl_d = new Uint8Array([4]);
    const ctrl_e = new Uint8Array([5]);

    const new_line = encoder.encode('\r\n');

    if (this.writer) {
      await this.writer.write(ctrl_e);
      await this.writer.write(new_line);

      const data = encoder.encode(code);
      await this.writer.write(data);

      await this.writer.write(ctrl_d);
      await this.writer.write(new_line);
    }

    await this.waitForPrompt();

    return {
      status: 'ok',
      execution_count: this.executionCount,
      user_expressions: {},
    };
  }

  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content'],
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content'],
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content'],
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content'],
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {}

  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {}

  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {}

  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {}

  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'embedded',
      implementation_version: '1.0.0',
      language_info: {
        codemirror_mode: {
          name: 'python',
          version: 3,
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.8',
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'Echo Kernel with Serial Support',
      help_links: [
        {
          text: 'Echo Kernel',
          url: 'https://github.com/jupyterlite/echo-kernel',
        },
      ],
    };

    return content;
  }
}
