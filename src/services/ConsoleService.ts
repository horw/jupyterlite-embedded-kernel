import { KernelMessage } from '@jupyterlab/services';
import { DeviceService } from './DeviceService';
import { ErrorHandler } from '../utils/ErrorHandler';

export type StreamCallback = (content: KernelMessage.IStreamMsg['content']) => void;
export interface ReadOutputResult {
  success: boolean;
  error?: string;
}

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

  async readAndParseOutput(
    streamCallback: StreamCallback
  ): Promise<ReadOutputResult> {
    const logger = (msg: string, data?: any) => console.debug(`[ConsoleService] readAndParseOutput - ${msg}`, data || '');
    logger('Starting to read output');
    
    let buffer = '';
    let outputStarted = false;
    let timeout = 10000; // 10 seconds timeout
    const startTime = Date.now();

    try {
      // Ensure we can read from the device
      const transport = this.deviceService.getTransport();
      if (!transport || !transport.device.readable) {
        const error = 'Device transport not readable';
        logger(error);
        return {
          success: false,
          error
        };
      }

      logger('Transport is readable, waiting for data');
      while (true) {
        const { text, done } = await this.deviceService.readAndDecodeFromDevice();
        
        if (done) {
          logger('Read operation done');
          break;
        }
        
        if (text) {
          buffer += text;
          let current_buffer = text;
          const truncate = (str: string, len = 50) => str.substring(0, len) + (str.length > len ? '...' : '');
          logger('Received text', truncate(text));
          logger('Current buffer', truncate(buffer));
          
          // Check if we've found the start marker
          if (!outputStarted && buffer.includes('######START REQUEST######')) {
            logger('Start marker found');
            outputStarted = true;
            buffer = buffer.split('######START REQUEST######')[1];
            current_buffer = buffer;
          }

          if (outputStarted) {
            current_buffer = current_buffer.split('>>')[0];
            logger('Streaming output');
            streamCallback({
              name: 'stdout',
              text: current_buffer
            });
          }

          // If we're collecting output and we see '>>', we're done
          if (outputStarted && buffer.includes('>>>')) {
            const output = buffer.split('>>>')[0].trim();
            logger('Output complete', truncate(output));
            return { success: true };
          }
        }

        // Check for timeout
        if (Date.now() - startTime > timeout) {
          logger('Timeout reached');
          return { 
            success: false, 
            error: 'Command execution timed out' 
          };
        }

        // Small delay to prevent tight loop
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      logger('Completed successfully');
      return { success: true };
    } catch (err) {
      logger('Error occurred');
      return { 
        success: false, 
        error: ErrorHandler.getErrorMessage(err)
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
  ): Promise<ReadOutputResult> {
    const logger = (msg: string, data?: any) => console.debug(`[ConsoleService] executeCommand - ${msg}`, data || '');
    logger('Starting command execution');
    
    try {
      // Send the command
      logger('Sending command to device');
      const sendSuccess = await this.deviceService.sendCommand(code);
      if (!sendSuccess) {
        logger('Failed to send command');
        return {
          success: false,
          error: 'Failed to send command to device'
        };
      }

      // Read and parse the output
      logger('Command sent, reading output');
      const result = await this.readAndParseOutput(streamCallback);
      logger('Command execution completed', { success: result.success });
      return result;
    } catch (err) {
      logger('Error occurred');
      return {
        success: false,
        error: ErrorHandler.getErrorMessage(err)
      };
    }
  }

  /**
   * Reset the console by sending a Ctrl+C to interrupt any running process
   * and attempt to get a clean prompt
   */
  async resetConsole(): Promise<void> {
    const logger = (msg: string) => console.debug(`[ConsoleService] resetConsole - ${msg}`);
    logger('Sending reset sequence');
    
    try {
      // Send Ctrl+C to interrupt any running process
      await this.deviceService.sendInterrupt();
      
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send a few newlines to get a clean prompt
      const encoder = new TextEncoder();
      const newLine = encoder.encode('\r\n');

      const transport = this.deviceService.getTransport();
      if (transport && transport.device.writable) {
        const writer = transport.device.writable.getWriter();
        await writer.write(newLine);
        await writer.write(newLine);
        writer.releaseLock();
      }
      
      logger('Reset sequence complete');
    } catch (err) {
      logger(`Error during reset: ${ErrorHandler.getErrorMessage(err)}`);
    }
  }
}
