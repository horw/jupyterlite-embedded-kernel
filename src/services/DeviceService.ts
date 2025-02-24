import { Transport } from 'esptool-js';
import { ErrorHandler } from '../utils/ErrorHandler';

export class DeviceService {
  private static instance: DeviceService;
  private transport?: Transport;
  private connected: boolean = false;

  private constructor() {}

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async connect(): Promise<Transport> {
    try {
      const device = await navigator.serial.requestPort();
      const transport = new Transport(device, true);
      await transport.connect();
      this.transport = transport;
      this.connected = true;
      return transport;
    } catch (err) {
      this.transport = undefined;
      this.connected = false;
      throw await ErrorHandler.handleError(err, 'Device connection');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.transport?.disconnect();
      this.transport = undefined;
      this.connected = false;
    } catch (err) {
      throw await ErrorHandler.handleError(err, 'Device disconnection');
    }
  }

  async reset(): Promise<void> {
    if (!this.transport) {
      throw new Error('Device not connected');
    }
    try {
      await this.transport.setDTR(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this.transport.setDTR(true);
    } catch (err) {
      throw await ErrorHandler.handleError(err, 'Device reset');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getTransport(): Transport | undefined {
    return this.transport;
  }

  setTransport(transport: Transport | undefined): void {
    this.transport = transport;
    this.connected = !!transport;
  }
}
