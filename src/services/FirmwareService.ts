import { firmwareOptions } from '../constants'
import { DeviceService } from './DeviceService';

export class FirmwareService {
  private firmwareString: string | null = null;
  private firmwareBlob: Blob | null = null;
  private selectedFirmwareId: string = 'Auto';
  private indexDBFirmware: string[] = [];
  
 constructor(private deviceService: DeviceService) {
    const savedSelection = localStorage.getItem('selectedFirmwareId');
    this.selectedFirmwareId = savedSelection || 'auto';
  }

  public getIndexDBFirmwares(): string[] {
   return this.indexDBFirmware
  }

  public async init() {
    try {
      this.indexDBFirmware = await this.loadFirmwareFromIndexedDB();
      console.log(this.indexDBFirmware);
    } catch (error) {
      console.error("Initialization failed:", error);
    }
  }

  private loadFirmwareFromIndexedDB(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("JupyterLite Storage");

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const keysRequest = store.getAllKeys();

        keysRequest.onsuccess = () => {
          const allKeys = keysRequest.result;
          const binaries = allKeys.filter((key): key is string =>
            typeof key === "string" && key.startsWith("binaries/") && key.endsWith('.bin')
          );
          resolve(binaries);
        };

        keysRequest.onerror = () => reject("Failed to get keys from IndexedDB");
      };

      request.onerror = () => reject("Failed to open IndexedDB");
    });
  }

  public getFirmwareBlob(filePath: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("JupyterLite Storage");

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const fileRequest = store.get(filePath);

        fileRequest.onsuccess = () => {
          const fileEntry = fileRequest.result;
          if (fileEntry?.content) {
            const blob = new Blob([fileEntry.content], { type: "application/octet-stream" });
            resolve(blob);
          } else {
            reject("File not found or empty");
          }
        };

        fileRequest.onerror = () => reject("Failed to get file from IndexedDB");
      };

      request.onerror = () => reject("Failed to open IndexedDB");
    });
  }

  getFirmwareOptions(){
    return firmwareOptions;
  }

  getSelectedFirmwareId(): string {
    return this.selectedFirmwareId;
  }

  setSelectedFirmwareId(id: string): void {
    if (id in firmwareOptions){
      this.selectedFirmwareId = id;
      this.firmwareString = null;
      this.firmwareBlob = null;
      localStorage.removeItem('cachedFirmware');
      localStorage.setItem('selectedFirmwareId', id);
    }
  }

  getFlashAddress(): number{
    return firmwareOptions[this.getSelectedFirmwareId()].flash_address
  }

  async downloadFirmware(): Promise<string> {
    const savedFirmwareId = localStorage.getItem('selectedFirmwareId');
    if (savedFirmwareId) {
      this.selectedFirmwareId = savedFirmwareId;
    }
    
    if (this.selectedFirmwareId === 'auto') {
      return this.downloadAutoDetectedFirmware();
    } else {
      return this.downloadSpecificFirmware(this.selectedFirmwareId);
    }
  }
  
  private async downloadAutoDetectedFirmware(): Promise<string> {
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
    
    return this.downloadSpecificFirmware(firmwareId);
  }
  
  private async downloadSpecificFirmware(firmwareId: string): Promise<string> {
    const selectedFirmware = firmwareOptions[firmwareId]
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

    return this.firmwareString;
  }

}
