import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { DeviceService } from './services/DeviceService';

export class EchoKernel extends BaseKernel {
  public deviceService: DeviceService = DeviceService.getInstance();

  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'embedded',
      implementation_version: '0.1.0',
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
      banner: 'Embedded Kernel with Serial Support',
      help_links: [],
    };

    return content;
  }

  async interrupt(): Promise<void> {
    const transport = this.deviceService.getTransport();
    if (transport && transport.device.writable) {
      const ctrl_c = new Uint8Array([3]);
      const encoder = new TextEncoder();
      const new_line = encoder.encode('\r\n');
      const writer = transport.device.writable.getWriter();
      await writer.write(ctrl_c);
      await writer.write(new_line);
      writer.releaseLock();
    }
  }

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content'],
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {

    console.log("Execute Request")
    if (this.deviceService == undefined){
      return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Missing MicroPython firmware URL',
          traceback: ['Please provide MicroPython firmware URL']
        };
    }

    console.log("Execute Request")
    const { code } = content;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const ctrl_d = new Uint8Array([4]);
    const ctrl_e = new Uint8Array([5]);
    const new_line = encoder.encode('\r\n');

    try {
      const transport = this.deviceService.getTransport();
      if (!transport) {
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'TransportError',
          evalue: 'No transport available',
          traceback: ['Please connect a device first']
        };
      }
      
      if (!transport.device.writable) {
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Device not writable',
          traceback: ['Unable to write to device']
        };
      }
      
      console.log("Try to write");
      const writer = transport.device.writable.getWriter();
      await writer.write(ctrl_e);
      await writer.write(new_line);
      const data = encoder.encode(code + "######START REQUEST######");
      console.log(data);
      await writer.write(data);
      await writer.write(ctrl_d);
      await writer.write(new_line);
      writer.releaseLock();

      // Read response with buffering
      let buffer = '';
      let outputStarted = false;
      let timeout = 5000; // 5 second timeout
      const startTime = Date.now();

      while (true) {
        const readLoop = transport.rawRead();
        const { value, done } = await readLoop.next();
        
        if (done) break;
        
        if (value) {
          const chunk = decoder.decode(value);
          buffer += chunk;
          let current_buffer = chunk
          console.log(value)
          console.log(buffer)
          // Check if we've found the start marker
          if (!outputStarted && buffer.includes('######START REQUEST######')) {
            outputStarted = true;
            buffer = buffer.split('######START REQUEST######')[1];
            current_buffer = buffer
          }

          if (outputStarted){
            current_buffer = current_buffer.split('>>')[0];
            this.stream({
              name: 'stdout',
              text: current_buffer
            });
          }

          // If we're collecting output and we see '>>', we're done
          if (outputStarted && buffer.includes('>>>')) {
            const output = buffer.split('>>>')[0].trim();
            console.log('Output:', output);
            break;
          }
        }

        // Check for timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Command execution timed out');
        }

        // Small delay to prevent tight loop
        await new Promise(resolve => setTimeout(resolve, 20));
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
