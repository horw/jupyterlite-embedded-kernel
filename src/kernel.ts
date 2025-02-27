import { BaseKernel } from '@jupyterlite/kernel';
import { KernelMessage } from '@jupyterlab/services';
import { DeviceService } from './services/DeviceService';
import { ConsoleService } from './services/ConsoleService';

export class EmbeddedKernel extends BaseKernel {
  public deviceService: DeviceService = DeviceService.getInstance();
  private consoleService: ConsoleService = ConsoleService.getInstance();

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
    await this.deviceService.sendInterrupt();
  }

  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content'],
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {

    console.log("Execute Request this.deviceService == undefined")
    if (this.deviceService == undefined){
      return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ValueError',
          evalue: 'Missing MicroPython firmware URL',
          traceback: ['Please provide MicroPython firmware URL']
        };
    }

    console.log("Execute Request code")
    const { code } = content;

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
      
      // Execute the command and handle the output
      const result = await this.consoleService.executeCommand(code, (content) => {
        this.stream(content);
      });

      if (!result.success) {
        return {
          status: 'error',
          execution_count: this.executionCount,
          ename: 'ExecutionError',
          evalue: result.error || 'Unknown error',
          traceback: [result.error || 'Unknown error']
        };
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
