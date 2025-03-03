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
    
      // Create a container for the dropdown
      const dropdownContainer = document.createElement('div');
      dropdownContainer.className = 'firmware-dropdown-container';
      dropdownContainer.style.cssText = 'margin-top: 10px; width: 100%;';
    
      // Create the dropdown element
      this.dropdown = document.createElement('select');
      this.dropdown.className = 'firmware-selector';
      this.dropdown.style.cssText = 'width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #ccc;';
    
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
      
      // Append the dropdown to the container
      dropdownContainer.appendChild(this.dropdown);
      console.log('dropdownContainer') 
      // Append the container to the card
      this.cardContent.appendChild(dropdownContainer);
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
    super.update(props);
    
    // Re-create the dropdown if the card content was replaced
    // Use setTimeout to ensure DOM is updated before we add the dropdown
    setTimeout(() => this.initializeFlashCard(), 0);
  }
}
