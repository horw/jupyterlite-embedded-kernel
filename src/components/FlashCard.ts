import { Card, CardProps } from './Card';
import { FirmwareService } from '../services/FirmwareService';
import { DeviceService } from '../services/DeviceService';

export class FlashCard extends Card {
  private firmwareService: FirmwareService;
  private deviceService: DeviceService;
  private dropdown!: HTMLSelectElement;
  private cardContent!: HTMLDivElement;
  private deviceInfoElement: HTMLDivElement | null = null;

  constructor(props: CardProps, onClick: () => void) {
    super(props, onClick);
    this.firmwareService = FirmwareService.getInstance();
    this.deviceService = DeviceService.getInstance();
    
    setTimeout(() => this.initializeFlashCard(), 0);
  }

  private initializeFlashCard(): void {
    // Create firmware dropdown
    this.createFirmwareDropdown();
    
    // Add custom click handling to prevent dropdown clicks from triggering flash
    // Only if dropdown was successfully created
    if (this.dropdown) {
      this.handleDropdownClickEvents();
    }
    
    // Setup event listeners to update UI when device is connected or flash is complete
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Listen for device connection events
    document.addEventListener('deviceConnected', () => {
      console.log('FlashCard received deviceConnected event');
      this.updateDeviceInfo();
      
      // Also update the dropdown to reflect any changes
      if (this.dropdown) {
        this.dropdown.value = this.firmwareService.getSelectedFirmwareId();
      }
    });
    
    // Listen for flash complete events
    document.addEventListener('flashComplete', () => {
      console.log('FlashCard received flashComplete event');
      this.updateDeviceInfo();
      
      // Also update the dropdown to reflect any changes
      if (this.dropdown) {
        this.dropdown.value = this.firmwareService.getSelectedFirmwareId();
      }
    });
  }

  private createFirmwareDropdown(): void {
    if (!this.firmwareService) {
      console.error('FirmwareService is not initialized');
    }

    try {
      // Find the card content
      this.cardContent = this.element.querySelector('.card-content') as HTMLDivElement;
      if (!this.cardContent) {
        console.error('Card content element not found');
        return;
      }
      
      // Check if dropdown already exists in the card content
      const existingDropdown = this.cardContent.querySelector('.firmware-dropdown-container');
      if (existingDropdown) {
        console.log('Dropdown already exists, skipping creation');
        return;
      }
      
      // Create a container for the entire firmware selection section
      const firmwareSection = document.createElement('div');
      firmwareSection.className = 'firmware-section';
      
      // Create a device info element to show detected device - display this first
      this.deviceInfoElement = document.createElement('div');
      this.deviceInfoElement.className = 'device-info';
      this.updateDeviceInfo();
      
      // Add the device info element right at the top
      firmwareSection.appendChild(this.deviceInfoElement);
      
      // Add a divider after device info
      const topDivider = document.createElement('div');
      topDivider.className = 'firmware-divider';
      firmwareSection.appendChild(topDivider);
      
      // Create a container for the dropdown
      const dropdownContainer = document.createElement('div');
      dropdownContainer.className = 'firmware-dropdown-container';
      
      // Create a label for the dropdown with a tooltip
      const label = document.createElement('label');
      label.className = 'firmware-dropdown-label';
      label.textContent = 'Firmware:';
      
      // Create the dropdown element
      this.dropdown = document.createElement('select');
      this.dropdown.className = 'firmware-selector';
    
      // Add options from the firmware service
      const firmwareOptions = this.firmwareService.getFirmwareOptions();
      firmwareOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name;
        this.dropdown.appendChild(optionElement);
      });
    
      // Always start with Auto selected when a device is connected
      const deviceType = this.deviceService.getDeviceType();
      if (deviceType) {
        // When device is detected, show Auto as selected but internally track the correct firmware
        this.dropdown.value = 'Auto';
        this.firmwareService.setSelectedFirmwareId('Auto');
        // The firmware service will handle selecting the right firmware during flashing
      } else {
        // If no device detected, use the stored preference
        this.dropdown.value = this.firmwareService.getSelectedFirmwareId();
      }
      
      // Add event listener for selection change
      this.dropdown.addEventListener('change', () => {
        this.firmwareService.setSelectedFirmwareId(this.dropdown.value);
        // Update device info when selection changes
        this.updateDeviceInfo();
      });
      
      // Append label and dropdown to the container
      dropdownContainer.appendChild(label);
      dropdownContainer.appendChild(this.dropdown);
      
      firmwareSection.appendChild(dropdownContainer);

      // Append the firmware section to the card content
      this.cardContent.appendChild(firmwareSection);
      console.log('Dropdown added to card');
    } catch (error) {
      console.error('Error creating firmware dropdown:', error);
    }
  }

  private handleDropdownClickEvents(): void {
    // Prevent dropdown clicks from triggering the card's click event
    if (this.dropdown) {
      this.dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    }
  }
  
  private updateDeviceInfo(): void {
    if (!this.deviceInfoElement) return;
    
    const deviceType = this.deviceService.getDeviceType();
    const selectedFirmware = this.firmwareService.getSelectedFirmwareId();
    
    this.deviceInfoElement.innerHTML = ``; // Clear previous content
    
    if (deviceType) {
      // Device has been detected after flashing - show which device was detected
      this.deviceInfoElement.innerHTML = `
        <div class="device-detected">
          <div class="device-detected-header">
            <span class="device-icon success">✓</span>
            <span class="device-status">Last connected device</span>
          </div>
          <div class="device-details">
            <span class="firmware-badge">${this.getRecommendedFirmwareForDevice(deviceType)}</span>
          </div>
        </div>
      `;
    } else if (selectedFirmware === 'Auto') {
      // Auto detection is selected - explain what will happen
      this.deviceInfoElement.innerHTML = `
        <div class="device-auto-mode">
          <div class="device-auto-header">
            <span class="device-icon waiting">🔍</span>
            <span class="device-status waiting">Auto-detection mode</span>
          </div>
          <div class="device-action-hint">
            When you click <strong>Flash</strong>, the appropriate firmware will be automatically selected based on your device type.
          </div>
        </div>
      `;
    } else {
      // A specific firmware is manually selected
      this.deviceInfoElement.innerHTML = `
        <div class="device-not-detected">
          <div class="device-auto-header">
            <span class="device-icon">🔧</span>
            <span class="device-status">Manual selection</span>
          </div>
          <div class="device-manual-mode">
            Will flash with <strong>${selectedFirmware}</strong> firmware regardless of device type
          </div>
        </div>
      `;
    }
    
    this.deviceInfoElement.style.display = 'block';
  }
  
  private getRecommendedFirmwareForDevice(deviceType: string): string {
    if (deviceType.includes('C6')) {
      return 'ESP32-C6';
    } else if (deviceType.includes('C3')) {
      return 'ESP32-C3';
    } else {
      return 'ESP32';
    }
  }

  // Completely override the update method for FlashCard
  update(props: CardProps): void {

    // Set the entire element HTML to our custom format
    this.element.innerHTML = `
      <div class="card-content">
        <div class="card-header">
          <span class="welcome-icon">${props.icon}</span>
          <div>
            <h3 class="card-title">${props.title}</h3>
            <p class="card-description">${props.description}</p>
          </div>
        </div>
      </div>
    `;
    
    // Get the card content element reference
    this.cardContent = this.element.querySelector('.card-content') as HTMLDivElement;

    setTimeout(() => this.initializeFlashCard(), 0);
  }
}
