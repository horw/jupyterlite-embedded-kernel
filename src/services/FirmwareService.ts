import { DeviceService } from './DeviceService';

export interface FirmwareOption {
  id: string;
  name: string;
  url: string;
}

export class FirmwareService {
  private static instance: FirmwareService;
  private deviceService: DeviceService;
  private firmwareString: string | null = null;
  private firmwareBlob: Blob | null = null;
  private selectedFirmwareId: string = 'Auto';
  
  // Available firmware options
  private firmwareOptions: FirmwareOption[] = [
    {
      id: 'Auto',
      name: "Auto detection",
      url: ''
    },
    {
      id: 'esp32',
      name: 'ESP32',
      url: 'https://horw.github.io/buffer/ESP32_GENERIC-20241129-v1.24.1.bin'
    },
    {
      id: 'esp32-c3',
      name: 'ESP32 C3',
      url: 'https://horw.github.io/buffer/ESP32_GENERIC_C3-20241129-v1.24.1.bin'
    },
    {
      id: 'esp32-c6',
      name: 'ESP32 C6',
      url: 'https://horw.github.io/buffer/ESP32_GENERIC_C6-20241129-v1.24.1.bin'
    }
  ];

  private constructor() {
    this.deviceService = DeviceService.getInstance();
  }

  static getInstance(): FirmwareService {
    if (!FirmwareService.instance) {
      FirmwareService.instance = new FirmwareService();
    }
    return FirmwareService.instance;
  }

  async loadCachedFirmware(): Promise<string | null> {
    const cachedFirmware = localStorage.getItem('cachedFirmware');
    if (cachedFirmware) {
      this.firmwareString = cachedFirmware;
      console.log('Loaded firmware from localStorage');
    }
    return this.firmwareString;
  }

  getFirmwareOptions(): FirmwareOption[] {
    return this.firmwareOptions;
  }

  getSelectedFirmwareId(): string {
    return this.selectedFirmwareId;
  }

  setSelectedFirmwareId(id: string): void {
    if (this.firmwareOptions.some(option => option.id === id)) {
      this.selectedFirmwareId = id;
      // Clear cached firmware when changing selection
      this.firmwareString = null;
      this.firmwareBlob = null;
      localStorage.removeItem('cachedFirmware');
      localStorage.setItem('selectedFirmwareId', id);
    }
  }

  async downloadFirmware(): Promise<string> {
    // Load selected firmware ID from localStorage if available
    const savedFirmwareId = localStorage.getItem('selectedFirmwareId');
    if (savedFirmwareId) {
      this.selectedFirmwareId = savedFirmwareId;
    }
    
    // Handle Auto detection mode
    if (this.selectedFirmwareId === 'Auto') {
      return this.downloadAutoDetectedFirmware();
    } else {
      return this.downloadSpecificFirmware(this.selectedFirmwareId);
    }
  }
  
  private async downloadAutoDetectedFirmware(): Promise<string> {
    // Get device type from DeviceService
    const deviceType = this.deviceService.getDeviceType();
    let firmwareId: string;
    
    if (!deviceType) {
      console.warn('No device detected for auto firmware detection. Using generic ESP32 firmware.');
      firmwareId = 'esp32';
    } else if (deviceType.includes('C6')) {
      console.log('Auto-detected ESP32-C6, using corresponding firmware');
      firmwareId = 'esp32-c6';
    } else if (deviceType.includes('C3')) {
      console.log('Auto-detected ESP32-C3, using corresponding firmware');
      firmwareId = 'esp32-c3';
    } else {
      console.log('Auto-detected generic ESP32, using corresponding firmware');
      firmwareId = 'esp32';
    }
    
    // Download the detected firmware
    return this.downloadSpecificFirmware(firmwareId);
  }
  
  private async downloadSpecificFirmware(firmwareId: string): Promise<string> {
    const selectedFirmware = this.firmwareOptions.find(option => option.id === firmwareId);
    if (!selectedFirmware || !selectedFirmware.url) {
      throw new Error(`Invalid firmware selection or no URL for: ${firmwareId}`);
    }

    const result = await fetch(selectedFirmware.url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/octet-stream',
      }
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch firmware: ${result.status} ${result.statusText}`);
    }

    this.firmwareBlob = await result.blob();
    const uint8Array = new Uint8Array(await this.firmwareBlob.arrayBuffer());
    this.firmwareString = Array.from(uint8Array)
      .map(byte => String.fromCharCode(byte))
      .join('');

    try {
      localStorage.setItem('cachedFirmware', this.firmwareString);
      console.log('Firmware cached in localStorage');
    } catch (e) {
      console.warn('Failed to cache firmware in localStorage:', e);
    }

    return this.firmwareString;
  }

  getFirmwareString(): string | null {
    return this.firmwareString;
  }

  getFirmwareBlob(): Blob | null {
    return this.firmwareBlob;
  }
}
