import { Transport } from 'esptool-js';

export class DeviceService {
  private static instance: DeviceService;
  private port: SerialPort | null = null;
  private transport: Transport | null = null;
  private isDeviceConnected: boolean = false;
  private decoder: TextDecoder = new TextDecoder();

  private constructor() {}

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async requestPort(): Promise<void> {
    try {
      const port = await navigator.serial.requestPort();
      this.port = port;
      this.transport = new Transport(port);
    } catch (err) {
      console.error('Failed to get port:', err);
      throw err;
    }
  }

  async connect(): Promise<void> {
    if (!this.port) {
      await this.requestPort();
    }

    if (!this.port) {
      throw new Error('No port selected');
    }

    try {
      // Check if already connected
      if (this.isDeviceConnected) {
        console.log('Already connected, skipping connection');
        return;
      }
      
      // Only try to connect if we have a port and it's not already open
      if (!this.port.readable && !this.port.writable) {
        this.transport?.connect()
      } else {
        console.log('Port is already open, skipping connection');
      }
      
      this.isDeviceConnected = true;
    } catch (err) {
      console.error('Failed to connect:', err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.port && this.port.readable) {
      try {
        // Check if the readable is locked before closing
        if (this.port.readable.locked || (this.port.writable && this.port.writable.locked)) {
          console.warn('Serial port streams are locked, cannot close properly');
          // We'll still update our internal state
          this.isDeviceConnected = false;
          return;
        }
        
        await this.port.close();
        this.isDeviceConnected = false;
      } catch (err) {
        console.error('Failed to disconnect:', err);
        // Even if close fails, update our internal state
        this.isDeviceConnected = false;
      }
    } else {
      // If there's no readable, just update state
      this.isDeviceConnected = false;
    }
  }

  async reset(): Promise<void> {
    if (!this.port) {
      throw new Error('No port selected');
    }

    try {
      await this.port.setSignals({ dataTerminalReady: false });
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.port.setSignals({ dataTerminalReady: true });
    } catch (err) {
      console.error('Failed to reset device:', err);
      throw err;
    }
  }

  getTransport(): Transport | null {
    return this.transport;
  }

  isConnected(): boolean {
    return this.isDeviceConnected;
  }

  clearPort(): void {
    this.port = null;
    this.transport = null;
    this.isDeviceConnected = false;
  }

  async writeToDevice(data: Uint8Array): Promise<boolean> {
    if (!this.transport || !this.transport.device.writable) {
      return false;
    }

    try {
      const writer = this.transport.device.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Error writing to device:', error);
      return false;
    }
  }

  async sendCommand(code: string): Promise<boolean> {
    if (!this.transport || !this.transport.device.writable) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const ctrl_d = new Uint8Array([4]);
      const ctrl_e = new Uint8Array([5]);
      const new_line = encoder.encode('\r\n');
      
      const writer = this.transport.device.writable.getWriter();
      
      // Send Ctrl+E to enter paste mode
      await writer.write(ctrl_e);
      await writer.write(new_line);
      
      // Send the code with a marker
      const data = encoder.encode(code + "######START REQUEST######");
      await writer.write(data);
      
      // Send Ctrl+D to execute
      await writer.write(ctrl_d);
      await writer.write(new_line);
      
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Error sending command to device:', error);
      return false;
    }
  }

  async sendInterrupt(): Promise<boolean> {
    if (!this.transport || !this.transport.device.writable) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const ctrl_c = new Uint8Array([3]);
      const new_line = encoder.encode('\r\n');
      
      const writer = this.transport.device.writable.getWriter();
      await writer.write(ctrl_c);
      await writer.write(new_line);
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Error sending interrupt to device:', error);
      return false;
    }
  }

  async readFromDevice(): Promise<IteratorResult<Uint8Array, any>> {
    if (!this.transport || !this.transport.device.readable) {
      console.error('Transport not readable in readFromDevice');
      return { value: undefined, done: true };
    }

    try {
      const readLoop = this.transport.rawRead();
      return await readLoop.next();
    } catch (error) {
      console.error('Error reading from device:', error);
      
      // Don't try to force reconnection here - it might cause more issues
      // Just let the caller handle the error
      return { value: undefined, done: true };
    }
  }

  async readAndDecodeFromDevice(): Promise<{ text: string, done: boolean }> {
    const { value, done } = await this.readFromDevice();
    console.log('[readAndDecodeFromDevice] ', value);
    if (done || !value) {
      return { text: '', done: true };
    }
    
    const text = this.decoder.decode(value);
    return { text, done: false };
  }

  decodeValue(value: Uint8Array): string {
    return this.decoder.decode(value);
  }
}
