import { Card, CardProps } from './Card';
import { DeviceService } from '../services/DeviceService';
import { FirmwareService } from '../services/FirmwareService';

export interface DialogProps {
  onClose: () => void;
  onConnect: () => void;
  onFlash: () => void;
  onReset: () => void;
  deviceService: DeviceService;
  firmwareService?: FirmwareService;
}

export class Dialog {
  private element: HTMLDivElement;
  private connectCard: Card;
  private deviceService: DeviceService;
  private firmwareService: FirmwareService;

  constructor(props: DialogProps) {
    this.deviceService = props.deviceService;
    this.firmwareService = props.firmwareService || FirmwareService.getInstance();
    this.element = document.createElement('div');
    this.element.className = 'welcome-dialog';

    const closeButton = this.createCloseButton(props.onClose);
    const header = this.createHeader();
    const firmwareSelector = this.createFirmwareSelector();
    const optionsContainer = this.createOptionsContainer();

    // Create cards
    this.connectCard = new Card(this.getConnectCardProps(), props.onConnect);
    const flashCard = new Card({
      action: 'flash',
      icon: '⚡️',
      title: 'Flash Device',
      description: 'Flash your device with the latest firmware',
      color: 'var(--ui-red)'
    }, props.onFlash);

    const resetCard = new Card({
      action: 'reset-esp',
      icon: '🔄',
      title: 'Hard reset Esp',
      description: 'Hard reset esp chip',
      color: 'var(--ui-red)'
    }, props.onReset);

    optionsContainer.appendChild(this.connectCard.getElement());
    optionsContainer.appendChild(flashCard.getElement());
    optionsContainer.appendChild(resetCard.getElement());

    this.element.appendChild(closeButton);
    this.element.appendChild(header);
    this.element.appendChild(firmwareSelector);
    this.element.appendChild(optionsContainer);
  }

  private createCloseButton(onClose: () => void): HTMLButtonElement {
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', onClose);
    return closeButton;
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.innerHTML = '<h1 class="welcome-title">ESP32 Device Manager</h1>';
    return header;
  }

  private createOptionsContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';
    return container;
  }
  
  private createFirmwareSelector(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'firmware-selector-container';
    container.style.cssText = 'margin: 1rem 0; padding: 0 1rem;';
    
    const label = document.createElement('label');
    label.textContent = 'Select Device Type:';
    label.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: bold;';
    
    const select = document.createElement('select');
    select.className = 'firmware-selector';
    select.style.cssText = 'width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #ccc;';
    
    // Add options from the firmware service
    const firmwareOptions = this.firmwareService.getFirmwareOptions();
    firmwareOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.id;
      optionElement.textContent = option.name;
      select.appendChild(optionElement);
    });
    
    // Set the selected option based on the current firmware service state
    select.value = this.firmwareService.getSelectedFirmwareId();
    
    // Add event listener for selection change
    select.addEventListener('change', () => {
      this.firmwareService.setSelectedFirmwareId(select.value);
    });
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }

  private getConnectCardProps(): CardProps {
    const isConnected = this.deviceService.isConnected();
    return {
      action: 'connect',
      icon: isConnected ? '✓' : '🔌',
      title: isConnected ? 'Device Connected' : 'Connect Device',
      description: isConnected ? 'Click to disconnect' : 'Connect to ESP32 device via serial',
      color: 'var(--ui-navy)'
    };
  }

  updateConnectCard(props: CardProps): void {
    this.connectCard.update(props);
  }

  getElement(): HTMLDivElement {
    return this.element;
  }
}
