import { Card, CardProps } from './Card';
import { FirmwareService } from '../services/FirmwareService';

export class FlashCard extends Card {
  private firmwareService: FirmwareService;
  private dropdown!: HTMLSelectElement;
  private cardContent!: HTMLDivElement;

  constructor(props: CardProps, onClick: () => void) {
    super(props, onClick);
    this.firmwareService = FirmwareService.getInstance();
    
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
      // Get the element created by the parent Card class
      const element = this.getElement();
    
      // Find the card content
      this.cardContent = element.querySelector('.card-content') as HTMLDivElement;
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
    
      // Set the selected option based on the current firmware service state
      this.dropdown.value = this.firmwareService.getSelectedFirmwareId();
      
      // Add event listener for selection change
      this.dropdown.addEventListener('change', () => {
        this.firmwareService.setSelectedFirmwareId(this.dropdown.value);
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
      
      // Append the divider and dropdown container to the firmware section
      firmwareSection.appendChild(divider);
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

  // Override update method to preserve the dropdown
  update(props: CardProps): void {
    // Store the current firmware section before the card gets updated
    const firmwareSection = this.cardContent?.querySelector('.firmware-section');
    
    // Call parent update to update the card content
    super.update(props);
    
    // Get the newly updated card content element
    const element = this.getElement();
    this.cardContent = element.querySelector('.card-content') as HTMLDivElement;
    
    if (this.cardContent) {
      // Wrap the existing content in a header div
      const contentChildren = Array.from(this.cardContent.children);
      
      // Create header container
      const headerContainer = document.createElement('div');
      headerContainer.className = 'card-header';
      
      // Move all existing content into the header container
      contentChildren.forEach(child => {
        // Skip if it's already our firmware section
        if (child.className !== 'firmware-section') {
          headerContainer.appendChild(child);
        }
      });
      
      // Replace content with new structure
      this.cardContent.innerHTML = '';
      this.cardContent.appendChild(headerContainer);
      
      // Re-add firmware section if it existed
      if (firmwareSection) {
        this.cardContent.appendChild(firmwareSection);
        console.log('Firmware section re-added after update');
      } else {
        // If there was no firmware section, initialize it
        setTimeout(() => this.initializeFlashCard(), 0);
      }
    }
  }
}
