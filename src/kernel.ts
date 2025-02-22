import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { Transport } from 'esptool-js';

export class EchoKernel extends BaseKernel {
  public transport?: Transport;

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

    if (this.transport == undefined){
      return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Missing MicroPython firmware URL',
          traceback: ['Please provide MicroPython firmware URL']
        };
    }

    const { code } = content;

    const encoder = new TextEncoder();
    // const ctrl_a = new Uint8Array([1])
    const ctrl_d = new Uint8Array([4]);
    const ctrl_e = new Uint8Array([5]);

    const new_line = encoder.encode('\r\n');

    await this.transport.write(ctrl_e);
    await this.transport.write(new_line);

    const data = encoder.encode(code+"######START REQUEST######");
    await this.transport.write(data);

    await this.transport.write(ctrl_d);
    await this.transport.write(new_line);


    // await this.transport.setDTR(false);
    // await new Promise((resolve) => setTimeout(resolve, 100));
    // await this.transport.setDTR(true);

    const readLoop = this.transport.rawRead();
    const { value, done } = await readLoop.next();

    console.log(value);
    console.log(done);
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
