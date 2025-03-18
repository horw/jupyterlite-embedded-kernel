export class MinimizedButton {
  private element: HTMLElement;
  private deviceLabel: HTMLSpanElement;

  constructor(onShow: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'esp-button-container';
    this.element.title = 'Open ESP32 Device Manager';
    this.element.style.display = 'none';
    this.element.addEventListener('click', onShow);

    const minimizedButton = document.createElement('button');
    minimizedButton.className = 'minimized-button';

    const contentContainer = document.createElement('div');
    contentContainer.className = 'button-content';

    const img = document.createElement('img');
    img.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
    img.alt = 'Espressif Systems Logo';
    contentContainer.appendChild(img);
    
    const statusWrapper = document.createElement('div');
    statusWrapper.className = 'status-wrapper';
    
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    statusWrapper.appendChild(statusIndicator);
    
    this.deviceLabel = document.createElement('span');
    this.deviceLabel.className = 'device-label';
    this.deviceLabel.textContent = 'Not connected';
    statusWrapper.appendChild(this.deviceLabel);
    
    contentContainer.appendChild(statusWrapper);
    
    minimizedButton.appendChild(contentContainer);
    
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
    const statusIndicator = this.element.querySelector('.status-indicator') as HTMLElement;
    if (statusIndicator) {
      statusIndicator.classList.add('connected');
    }
    
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
