import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel } from '@jupyterlite/kernel';

/**
 * A kernel that echos content back.
 */
export class EchoKernel extends BaseKernel {

  public reader?: ReadableStreamDefaultReader<Uint8Array>; // The serial port reader.
  public writer?: WritableStreamDefaultWriter<Uint8Array>; // The serial port writer.

  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {

    const content: KernelMessage.IInfoReply = {
      implementation: 'Text',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'python',
          version: 3,
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'echo',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.8',
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'An echo kernel running in the browser',
      help_links: [
        {
          text: 'Echo Kernel',
          url: 'https://github.com/jupyterlite/echo-kernel'
        }
      ]
    };
    return content;
  }

  /**
   * Handle an `execute_request` message
   *
   * @param msg The parent message.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const { code } = content;

    const encoder = new TextEncoder();
    // const ctrl_a = new Uint8Array([1])
    const ctrl_d = new Uint8Array([4])
    const ctrl_e = new Uint8Array([5])

    const new_line = encoder.encode("\r\n");

    if (this.writer) {
      await this.writer.write(ctrl_e);
      await this.writer.write(new_line);

      const lines = code.split("\n"); // Split the code into lines
      for (const line of lines) {
        const data = encoder.encode(line+"\n");
        await this.writer.write(data);
        // await this.writer.write(new_line);
        console.log("Sent to serial:", data);
      }

      await this.writer.write(ctrl_d);
      await this.writer.write(new_line);

    }

    const processSerialData = async () => {
      try {
        let last_line = '';
        while (this.reader) {
          const { done, value } = await this.reader.read();

          if (done) {
            console.log("Serial port closed.");
            return; // End the task when done is true
          }

          const data = last_line + new TextDecoder().decode(value);
          const lines = data.split("\r\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            this.publishExecuteResult({
              execution_count: this.executionCount,
              data: {
                'text/plain': line
              },
              metadata: {}
            });
            if (line.includes('>>>')) {
              console.log("Found '>>>' string, stopping process.");
              return;
            }
          }
          last_line = lines[lines.length - 1];

        }
      } catch (error) {
        console.error(error);
      }
    };
    await processSerialData();

    return {
      status: 'ok',
      execution_count: this.executionCount,
      user_expressions: {}
    };
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle an `is_complete_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle a `comm_info_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `input_reply` message.
   *
   * @param content - The content of the reply.
   */
  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    throw new Error('Not implemented');
  }
}
