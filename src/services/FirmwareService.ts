export class FirmwareService {
  private static instance: FirmwareService;
  private firmwareString: string | null = null;
  private firmwareBlob: Blob | null = null;

  private constructor() {}

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

  async downloadFirmware(): Promise<string> {
    const result = await fetch('https://horw.github.io/buffer/ESP32_GENERIC_C3-20241129-v1.24.1.bin', {
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
