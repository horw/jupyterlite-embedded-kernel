import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { ESPLoader} from 'esptool-js';

/**
 * A kernel that handles MicroPython flashing and serial communication
 */
export class EchoKernel extends BaseKernel {
  public reader?: ReadableStreamDefaultReader<Uint8Array>;
  public writer?: WritableStreamDefaultWriter<Uint8Array>;
  public device?: ESPLoader;
  // public esploader?: ESPLoader;
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.streamOutput(`Error during flashing: ${errorMessage}\n`);
      throw error;
    }
  }

  async getFirmware(): Promise<string> {
    const firmwareUrl = 'https://micropython.org/resources/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin';
    
    try {
      const response = await fetch(firmwareUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch firmware: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (error) {
      console.error('Error fetching firmware:', error);
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
      const lines = code.split('\n').filter(line => line.trim());
      
      // If no URL provided, show the selection interface
      if (lines.length === 1) {
        const defaultFirmwareUrl = 'https://micropython.org/resources/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin';
        
        this.streamOutput(`Select a firmware option or enter a custom URL:\n\n`);
        this.streamOutput(`1. Latest ESP32-C3 Generic (${defaultFirmwareUrl})\n`);
        this.streamOutput(`2. Custom URL (Enter the complete URL on the next line)\n\n`);
        this.streamOutput(`Usage:\n`);
        this.streamOutput(`%%flash_micropython\n`);
        this.streamOutput(`<firmware_url>   # Replace with your URL or use option 1\n`);
        
        return {
          status: 'ok',
          execution_count: this.executionCount,
          user_expressions: {},
          payload: []
        };
      }

      let firmwareUrl = lines[1].trim();
      
      // If they selected option 1, use the default URL
      if (firmwareUrl === '1') {
        firmwareUrl = 'https://micropython.org/resources/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin';
      }
      
      if (!firmwareUrl || (firmwareUrl === '2')) {
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Missing MicroPython firmware URL',
          traceback: ['Please provide a valid MicroPython firmware URL']
        };
      }

      try {
        await this.flashMicroPython(firmwareUrl);
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
