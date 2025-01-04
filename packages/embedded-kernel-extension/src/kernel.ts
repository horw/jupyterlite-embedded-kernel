import {BaseKernel} from "@jupyterlite/kernel";
import {KernelMessage} from "@jupyterlab/services";


/**
 * A kernel that echos content back.
 */
export class EchoKernel extends BaseKernel {
  public reader?: ReadableStreamDefaultReader<Uint8Array>; // The serial port reader.
  public writer?: WritableStreamDefaultWriter<Uint8Array>; // The serial port writer.
  public port?: SerialPort; // The serial port writer.


  private blocker: Promise<void> | null = null;
  private blockerResolve: (() => void) | null = null;
  private first_run = true;

  private setBlocked(blocked: boolean): void {
      if (blocked && !this.blocker) {
          this.blocker = new Promise(resolve => {
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
      const ctrl_c = new Uint8Array([3])
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

  // /*
  //  * https://github.com/WICG/serial/issues/122
  //  */
  async readWithTimeout(timeoutMs: number = 500): Promise<Uint8Array | null | undefined> {
    if (!this.reader) return null;
    const result = await this.reader.read()
    return result.value
  }

  public async read_loop(){
    let outputBuffer = ''; // Buffer to accumulate data
    const sendInterval = 500; // Interval in milliseconds to send data

    const sendData = () => {

      if (outputBuffer) {
        this.streamOutput(outputBuffer); // Send accumulated data
        console.log(outputBuffer);
        outputBuffer = ''; // Clear the buffer
      }
    };
    const intervalId = setInterval(sendData, sendInterval);

    try {
      while (this.reader) {
        const value = await this.readWithTimeout();
        if (!value){ continue }

        const data = new TextDecoder().decode(value);
        console.log('Current buffer before: ', outputBuffer)
        outputBuffer += data
        console.log('Data: ',data)
        console.log('Current buffer after: ', outputBuffer)
        if (data.includes('>>>')) {
          this.setBlocked(false)
        }
      }
    }
      finally {
      clearInterval(intervalId); // Stop the timer when exiting the loop
      sendData(); // Ensure remaining data is sent
    }
  }

  private async waitForPrompt(): Promise<void> {
      if (this.blocker) {
          await this.blocker;
      }
  }

  // async readUntilError() {
  //   try {
  //     while (this.reader) {
  //       const data  = await this.readWithTimeout();
  //       if (data){
  //         const value = new TextDecoder().decode(data);
  //         this.streamOutput(value)
  //       }
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     return
  //   }
  // }

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

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content'],
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    this.setBlocked(true);
    if(this.first_run){
        this.read_loop();
        this.first_run = false;
    }


    const { code } = content;

    const encoder = new TextEncoder();
    // const ctrl_a = new Uint8Array([1])
    const ctrl_d = new Uint8Array([4]);
    const ctrl_e = new Uint8Array([5]);

    const new_line = encoder.encode('\r\n');
    console.log('2')

    if (this.writer) {
      await this.writer.write(ctrl_e);
      await this.writer.write(new_line);

      const data = encoder.encode(code);
      await this.writer.write(data);

      await this.writer.write(ctrl_d);
      await this.writer.write(new_line);
    }
    console.log('3')
    await this.waitForPrompt();
    console.log('4')
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
}