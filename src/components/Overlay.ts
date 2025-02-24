export class Overlay {
  private element: HTMLDivElement;

  constructor(onBackdropClick: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'welcome-overlay';
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        onBackdropClick();
      }
    });
  }

  appendChild(child: HTMLElement): void {
    this.element.appendChild(child);
  }

  getElement(): HTMLDivElement {
    return this.element;
  }
}
