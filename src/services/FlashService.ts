import { ESPLoader } from 'esptool-js';
import * as CryptoJS from 'crypto-js';
import { DeviceService } from './DeviceService';
import { FirmwareService } from './FirmwareService';
import { ProgressOverlay } from '../components/ProgressOverlay';
import { ErrorHandler } from '../utils/ErrorHandler';
import { ConsoleService } from './ConsoleService';

export class FlashService {
  private static instance: FlashService;
  private deviceService: DeviceService;
  private firmwareService: FirmwareService;
  private consoleService: ConsoleService;

  private constructor() {
    this.deviceService = DeviceService.getInstance();
    this.firmwareService = FirmwareService.getInstance();
    this.consoleService = ConsoleService.getInstance();
  }

  static getInstance(): FlashService {
    if (!FlashService.instance) {
      FlashService.instance = new FlashService();
    }
    return FlashService.instance;
  }

  async flashDevice(): Promise<void> {
    const progressOverlay = new ProgressOverlay();
    try {
      // First, ensure we're disconnected and get a fresh port
      // We'll just update state without forcing a close if locked
      await this.deviceService.disconnect();
      this.deviceService.clearPort();
      
      // Get a fresh port
      await this.deviceService.requestPort();

      const transport = this.deviceService.getTransport();
      if (!transport) {
        throw new Error('Failed to get device transport');
      }

      progressOverlay.show();
      const loaderOptions = {
        transport: transport,
        baudrate: 921600,
        romBaudrate: 115600
      };
      const esploader = new ESPLoader(loaderOptions);

      progressOverlay.setStatus('Connecting to device...');
      await esploader.main();

      progressOverlay.setStatus('Downloading firmware...');
      let firmwareString = await this.firmwareService.downloadFirmware();

      const flashOptions = {
        fileArray: [{
          data: firmwareString,
          address: 0x0
        }],
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        flashMode: "dio",
        flashFreq: "40m",
        reportProgress: (fileIndex: number, written: number, total: number) => {
          progressOverlay.updateProgress(written, total);
          console.log('Flash progress:', {fileIndex, written, total});
        },
        calculateMD5Hash: (image: string) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString()
      };

      await esploader.writeFlash(flashOptions);
      progressOverlay.setStatus('Flash complete!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After flashing is complete, clean things up
      console.log('Hard resetting via RTS pin...');
      try {
        await esploader.after();
      } catch (afterError) {
        console.warn('Error during esploader.after():', afterError);
      }
      
      // Try to gracefully reset rather than disconnect/connect
      try {
        await this.deviceService.reset();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to get a clean console prompt
        progressOverlay.setStatus('Initializing console...');
        await this.consoleService.resetConsole();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (resetError) {
        console.warn('Error during device reset:', resetError);
      }

      await this.deviceService.disconnect();
      this.deviceService.clearPort();

    } catch (err) {
      const errorMessage = ErrorHandler.getErrorMessage(err);
      progressOverlay.setStatus(`Flash failed: ${errorMessage}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      await progressOverlay.hide();
      
      // Don't try to force connections in finally block
      // Let the device naturally reconnect on next use
    }
  }
}
