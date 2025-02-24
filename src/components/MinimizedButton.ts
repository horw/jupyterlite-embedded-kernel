export class MinimizedButton {
  private element: HTMLButtonElement;

  constructor(onShow: () => void) {
    this.element = document.createElement('button');
    this.element.className = 'minimized-button';
    
    // Create and add the logo image
    const img = document.createElement('img');
    img.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
    img.alt = 'Espressif Systems Logo';
    this.element.appendChild(img);
    
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
}
