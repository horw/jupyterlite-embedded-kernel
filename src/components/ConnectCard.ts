import { Card, CardProps } from './Card';
import { DeviceService } from '../services/DeviceService';

export class ConnectCard extends Card {
  private deviceService: DeviceService;
  private deviceType: string = '';

  constructor(props: CardProps, onClick: () => void) {
    super(props, onClick);
    this.deviceService = DeviceService.getInstance();
    
    document.addEventListener('deviceConnected', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.deviceType) {
        this.deviceType = customEvent.detail.deviceType;

        console.log("device was connected")
        this.updateConnectCardWithDeviceInfo();
      }
    });
  }
  
  private updateConnectCardWithDeviceInfo(): void {
    const isConnected = this.deviceService.isConnected();
    
    let displayName = 'ESP32';
    if (this.deviceType.includes('C6')) {
      displayName = 'ESP32-C6';
    } else if (this.deviceType.includes('C3')) {
      displayName = 'ESP32-C3';
    }
    
    this.update({
      action: 'connect',
      icon: isConnected ? '✓' : '🔌',
      title: isConnected ? `${displayName} Connected` : 'Connect Device',
      description: isConnected 
        ? `Connected to ${displayName}. Click to disconnect` 
        : 'Connect to ESP32 device via serial',
      color: 'var(--ui-navy)'
    });
  }
}
