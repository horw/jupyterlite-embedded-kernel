export class MinimizedButton {
  private element: HTMLElement;
  private deviceLabel: HTMLSpanElement;

  constructor(onShow: () => void) {
    // Main container
    this.element = document.createElement('div');
    this.element.className = 'esp-button-container';
    this.element.title = 'Open ESP32 Device Manager';
    this.element.style.display = 'none';
    this.element.addEventListener('click', onShow);

    // Create button element
    const minimizedButton = document.createElement('button');
    minimizedButton.className = 'minimized-button';

    // Create a flex container for logo and status
    const contentContainer = document.createElement('div');
    contentContainer.className = 'button-content';

    // Logo element
    const img = document.createElement('img');
    img.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
    img.alt = 'Espressif Systems Logo';
    contentContainer.appendChild(img);
    
    // Create a status indicator wrapper
    const statusWrapper = document.createElement('div');
    statusWrapper.className = 'status-wrapper';
    
    // Add a visual indicator for connection status
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    statusWrapper.appendChild(statusIndicator);
    
    // Create a label to show which device is connected
    this.deviceLabel = document.createElement('span');
    this.deviceLabel.className = 'device-label';
    this.deviceLabel.textContent = 'Not connected';
    statusWrapper.appendChild(this.deviceLabel);
    
    contentContainer.appendChild(statusWrapper);
    
    // Add the content container to the button
    minimizedButton.appendChild(contentContainer);
    
    // Listen for device connection events
    document.addEventListener('deviceConnected', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.deviceType) {
        this.updateDeviceLabel(customEvent.detail.deviceType);
      }
    });

    this.element.appendChild(minimizedButton);
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
    // Update status indicator to show connected state
    const statusIndicator = this.element.querySelector('.status-indicator') as HTMLElement;
    if (statusIndicator) {
      statusIndicator.classList.add('connected');
    }
    
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
