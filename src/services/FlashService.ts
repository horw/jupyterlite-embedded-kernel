import { ESPLoader } from 'esptool-js';
import * as CryptoJS from 'crypto-js';
import { DeviceService } from './DeviceService';
import { FirmwareService } from './FirmwareService';
import { ProgressOverlay } from '../components/ProgressOverlay';
import { ErrorHandler } from '../utils/ErrorHandler';

export class FlashService {
  private static instance: FlashService;
  private deviceService: DeviceService;
  private firmwareService: FirmwareService;

  private constructor() {
    this.deviceService = DeviceService.getInstance();
    this.firmwareService = FirmwareService.getInstance();
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
      await this.deviceService.disconnect();
      await this.deviceService.connect();
      progressOverlay.show();

      const transport = this.deviceService.getTransport();
      if (!transport) {
        throw new Error('Failed to get device transport');
      }

      const loaderOptions = {
        transport: transport,
        baudrate: 115600,
        romBaudrate: 115600
      };
      const esploader = new ESPLoader(loaderOptions);

      progressOverlay.setStatus('Connecting to device...');
      await esploader.main();

      let firmwareString = this.firmwareService.getFirmwareString();
      if (!firmwareString) {
        progressOverlay.setStatus('Downloading firmware...');
        firmwareString = await this.firmwareService.downloadFirmware();
      }

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
    } catch (err) {
      const errorMessage = ErrorHandler.getErrorMessage(err);
      progressOverlay.setStatus(`Flash failed: ${errorMessage}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      await progressOverlay.hide();
    }
  }
}
