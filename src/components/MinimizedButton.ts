export class MinimizedButton {
  private element: HTMLButtonElement;
  private deviceLabel: HTMLSpanElement;

  constructor(onShow: () => void) {
    this.element = document.createElement('button');
    this.element.className = 'minimized-button';
    
    // Create and add the logo image
    const img = document.createElement('img');
    img.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
    img.alt = 'Espressif Systems Logo';
    this.element.appendChild(img);
    
    // Create a label to show which device is connected
    this.deviceLabel = document.createElement('span');
    this.deviceLabel.className = 'device-label';
    this.deviceLabel.textContent = 'ESP32';
    this.element.appendChild(this.deviceLabel);
    
    // Listen for device connection events
    document.addEventListener('deviceConnected', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.deviceType) {
        this.updateDeviceLabel(customEvent.detail.deviceType);
      }
    });
    
    this.element.title = 'Open ESP32 Device Manager';
    this.element.style.display = 'none';
    this.element.addEventListener('click', onShow);
  }

  show(): void {
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  getElement(): HTMLButtonElement {
    return this.element;
  }
  
  updateDeviceLabel(deviceType: string): void {
    // Format the device type to make it more readable
    let displayName = 'ESP32';
    
    if (deviceType.includes('C6')) {
      displayName = 'ESP32-C6';
    } else if (deviceType.includes('C3')) {
      displayName = 'ESP32-C3';
    }
    
    this.deviceLabel.textContent = displayName;
    this.element.title = `Open ESP32 Device Manager (${displayName})`;
  }
}
