export class UIService {
  private static instance: UIService;
  private styleElement: HTMLStyleElement | null = null;

  private constructor() {}

  static getInstance(): UIService {
    if (!UIService.instance) {
      UIService.instance = new UIService();
    }
    return UIService.instance;
  }

  initializeStyles(styles: string[]): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = styles.join('\n');
    document.head.appendChild(this.styleElement);
  }

  createContainer(className: string): HTMLDivElement {
    const container = document.createElement('div');
    container.className = className;
    return container;
  }
}
