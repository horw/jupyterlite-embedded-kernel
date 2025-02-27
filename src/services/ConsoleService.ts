import { KernelMessage } from '@jupyterlab/services';
import { DeviceService } from './DeviceService';

export type StreamCallback = (content: KernelMessage.IStreamMsg['content']) => void;

export class ConsoleService {
  private static instance: ConsoleService;
  private deviceService: DeviceService;

  private constructor() {
    this.deviceService = DeviceService.getInstance();
  }

  static getInstance(): ConsoleService {
    if (!ConsoleService.instance) {
      ConsoleService.instance = new ConsoleService();
    }
    return ConsoleService.instance;
  }

  /**
   * Read and parse output from the device
   * @param code The code that was sent to the device
   * @param streamCallback Callback function to stream output
   * @returns A promise that resolves when the command completes
   */
  async readAndParseOutput(
    code: string,
    streamCallback: StreamCallback
  ): Promise<{ success: boolean; error?: string }> {
    let buffer = '';
    let outputStarted = false;
    let timeout = 5000; // 5 second timeout
    const startTime = Date.now();

    try {
      while (true) {
        const { text, done } = await this.deviceService.readAndDecodeFromDevice();
        
        if (done) break;
        
        if (text) {
          buffer += text;
          let current_buffer = text;
          console.log(text);
          console.log(buffer);
          
          // Check if we've found the start marker
          if (!outputStarted && buffer.includes('######START REQUEST######')) {
            outputStarted = true;
            buffer = buffer.split('######START REQUEST######')[1];
            current_buffer = buffer;
          }

          if (outputStarted) {
            current_buffer = current_buffer.split('>>')[0];
            streamCallback({
              name: 'stdout',
              text: current_buffer
            });
          }

          // If we're collecting output and we see '>>', we're done
          if (outputStarted && buffer.includes('>>>')) {
            const output = buffer.split('>>>')[0].trim();
            console.log('Output:', output);
            return { success: true };
          }
        }

        // Check for timeout
        if (Date.now() - startTime > timeout) {
          return { 
            success: false, 
            error: 'Command execution timed out' 
          };
        }

        // Small delay to prevent tight loop
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      return { success: true };
    } catch (error) {
      console.error('Error reading output:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error reading output' 
      };
    }
  }

  /**
   * Send a command to the device and read the output
   * @param code The code to send to the device
   * @param streamCallback Callback function to stream output
   * @returns A promise that resolves when the command completes
   */
  async executeCommand(
    code: string,
    streamCallback: StreamCallback
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Send the command
      const sendSuccess = await this.deviceService.sendCommand(code);
      if (!sendSuccess) {
        return {
          success: false,
          error: 'Failed to send command to device'
        };
      }

      // Read and parse the output
      return await this.readAndParseOutput(code, streamCallback);
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error executing command'
      };
    }
  }
}
