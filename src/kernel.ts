import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { Transport } from 'esptool-js';

export class EchoKernel extends BaseKernel {
  public transport?: Transport;
  public writer?: WritableStreamDefaultWriter<Uint8Array>; // The serial port writer.


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
    const decoder = new TextDecoder();
    const ctrl_d = new Uint8Array([4]);
    const ctrl_e = new Uint8Array([5]);
    const new_line = encoder.encode('\r\n');

    try {
      // Send the command
      if (this.writer == undefined){
        this.writer = this.transport.device.writable?.getWriter();
      }
      if (this.writer == undefined){
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Missing Writter firmware URL',
          traceback: ['Please provide MicroPython firmware URL']
        };
      }
      await this.writer.write(ctrl_e);
      await this.writer.write(new_line);
      const data = encoder.encode(code + "######START REQUEST######");
      console.log(data)
      await this.writer.write(data);
      await this.writer.write(ctrl_d);
      await this.writer.write(new_line);


      // Read response with buffering
      let buffer = '';
      let outputStarted = false;
      let timeout = 5000; // 5 second timeout
      const startTime = Date.now();

      while (true) {
        const readLoop = this.transport.rawRead();
        const { value, done } = await readLoop.next();
        
        if (done) break;
        
        if (value) {
          const chunk = decoder.decode(value);
          buffer += chunk;
          console.log(value)
          console.log(buffer)
          // Check if we've found the start marker
          if (!outputStarted && buffer.includes('######START REQUEST######')) {
            outputStarted = true;
            buffer = buffer.split('######START REQUEST######')[1];
          }

          // If we're collecting output and we see '>>', we're done
          if (outputStarted && buffer.includes('>>')) {
            const output = buffer.split('>>')[0].trim();
            console.log('Output:', output);
            
            // Stream the output to the notebook
            this.stream({
              name: 'stdout',
              text: output + '\n'
            });
            
            break;
          }
        }

        // Check for timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Command execution timed out');
        }

        // Small delay to prevent tight loop
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return {
        status: 'ok',
        execution_count: this.executionCount,
        user_expressions: {},
      };

    } catch (error: any) {
      console.error('Execute error:', error);
      return {
        status: 'error',
        execution_count: this.executionCount,
        ename: 'ExecuteError',
        evalue: error instanceof Error ? error.message : 'Unknown error',
        traceback: error instanceof Error ? [error.stack || ''] : ['Unknown error occurred'],
      };
    }
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
