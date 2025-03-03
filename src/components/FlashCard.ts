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
    
      // Create a container for the dropdown
      const dropdownContainer = document.createElement('div');
      dropdownContainer.className = 'firmware-dropdown-container';
      
      // Create a device info element to show detected device
      this.deviceInfoElement = document.createElement('div');
      this.deviceInfoElement.className = 'device-info';
      this.updateDeviceInfo();
      
      // Create a label for the dropdown
      const label = document.createElement('label');
      label.className = 'firmware-dropdown-label';
      label.textContent = 'Select Firmware:';
      
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
    
      // Try to select the appropriate firmware based on detected device
      const deviceType = this.deviceService.getDeviceType();
      if (deviceType) {
        // Auto-select firmware based on device type
        if (deviceType.includes('C6')) {
          this.dropdown.value = 'esp32-c6';
          this.firmwareService.setSelectedFirmwareId('esp32-c6');
        } else if (deviceType.includes('C3')) {
          this.dropdown.value = 'esp32-c3';
          this.firmwareService.setSelectedFirmwareId('esp32-c3');
        } else if (deviceType.includes('ESP32')) {
          this.dropdown.value = 'esp32';
          this.firmwareService.setSelectedFirmwareId('esp32');
        }
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
      
      // Create a container for the entire firmware selection section
      const firmwareSection = document.createElement('div');
      firmwareSection.className = 'firmware-section';
      
      // Add a divider
      const divider = document.createElement('div');
      divider.className = 'firmware-divider';
      
      // Append the divider, device info, and dropdown container to the firmware section
      firmwareSection.appendChild(divider);
      if (this.deviceInfoElement) {
        firmwareSection.appendChild(this.deviceInfoElement);
      }
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
    
    if (deviceType) {
      // Device is detected
      this.deviceInfoElement.innerHTML = `
        <div class="device-detected">
          <span class="device-icon">🔍</span>
          <span>Detected: <strong>${deviceType}</strong></span>
        </div>
      `;
    } else if (selectedFirmware === 'Auto') {
      // Auto detection is selected but no device detected yet
      this.deviceInfoElement.innerHTML = `
        <div class="device-auto-mode">
          <span class="device-icon">⏳</span>
          <span>Connect device for auto-detection</span>
        </div>
      `;
    } else {
      // No device detected and a specific firmware is selected
      this.deviceInfoElement.innerHTML = `
        <div class="device-not-detected">
          <span class="device-icon">ℹ️</span>
          <span>No device detected yet</span>
        </div>
      `;
    }
    
    this.deviceInfoElement.style.display = 'block';
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
