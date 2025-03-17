export class MinimizedButton {
  private element: HTMLElement;
  private deviceLabel: HTMLSpanElement;

  constructor(onShow: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'esp-button-container';

    let minimized_button = document.createElement('button');
    minimized_button.className = 'minimized-button';

    const img = document.createElement('img');
    img.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
    img.alt = 'Espressif Systems Logo';
    minimized_button.appendChild(img);
    
    // Create a label to show which device is connected
    this.deviceLabel = document.createElement('span');
    this.deviceLabel.className = 'device-label';
    this.deviceLabel.textContent = 'ESP32';
    minimized_button.appendChild(this.deviceLabel);
    
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

    this.element.appendChild(minimized_button);
  }

  show(): void {
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  getElement(): HTMLElement {
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
