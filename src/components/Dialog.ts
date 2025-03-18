import { Card, CardProps } from './Card';
import { DeviceService } from '../services/DeviceService';
import { FlashService } from '../services/FlashService';
import { FlashCard } from './FlashCard';
import { ConnectCard } from './ConnectCard';

export interface DialogProps {
  closeDialog: () => void;
  deviceService: DeviceService;
  flashService: FlashService;
}

export class Dialog {
  private element: HTMLDivElement;
  private connectCard: ConnectCard;
  private flashCard: FlashCard;
  private resetCard: Card;
  private readonly deviceService: DeviceService;

  constructor(props: DialogProps) {
    this.deviceService = props.deviceService;
    this.element = document.createElement('div');
    this.element.className = 'welcome-overlay';
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        props.closeDialog
      }
    });

    const closeButton = this.createCloseButton(props.closeDialog);
    const header = this.createHeader();
    const optionsContainer = this.createOptionsContainer();

    this.connectCard = new ConnectCard(this.getConnectCardProps(), () => props.deviceService.connect());
    this.flashCard = new FlashCard({
      action: 'flash',
      icon: '⚡️',
      title: 'Flash Device',
      description: 'Flash your device with the latest firmware',
      color: 'var(--ui-red)'
    }, () => props.flashService.flashDevice());

    this.resetCard = new Card({
      action: 'reset-esp',
      icon: '🔄',
      title: 'Hard reset Esp',
      description: 'Hard reset esp chip',
      color: 'var(--ui-red)'
    }, () => props.deviceService.reset());

    optionsContainer.appendChild(this.connectCard.getElement());
    optionsContainer.appendChild(this.flashCard.getElement());
    optionsContainer.appendChild(this.resetCard.getElement());

    let content = document.createElement('div');
    content.className = 'welcome-dialog';

    content.appendChild(closeButton);
    content.appendChild(header);
    content.appendChild(optionsContainer);

    this.element.appendChild(content);
  }

  private createCloseButton(onCloseDialog: () => void): HTMLButtonElement {
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', onCloseDialog);
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

  getElement(): HTMLDivElement {
    return this.element;
  }
}
