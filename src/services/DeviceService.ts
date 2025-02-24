import { Transport } from 'esptool-js';

export class DeviceService {
  private static instance: DeviceService;
  private port: SerialPort | null = null;
  private transport: Transport | null = null;
  private isDeviceConnected: boolean = false;

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
      this.transport?.connect()
      // await this.port.open({ baudRate: 115200 });
      this.isDeviceConnected = true;
    } catch (err) {
      console.error('Failed to connect:', err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.port && this.port.readable) {
      try {
        await this.port.close();
        this.isDeviceConnected = false;
      } catch (err) {
        console.error('Failed to disconnect:', err);
        throw err;
      }
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
}
