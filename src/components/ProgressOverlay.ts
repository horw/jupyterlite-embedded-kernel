export class ProgressOverlay {
  private element: HTMLElement;
  private progressBar: HTMLElement;
  private statusEl: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'progress-overlay';
    this.element.innerHTML = `
      <div class="progress-container">
        <div class="progress-title">Flashing Firmware...</div>
        <div class="progress-bar-container">
          <div class="progress-bar"></div>
        </div>
        <div class="progress-status">Initializing...</div>
      </div>
    `;

    this.progressBar = this.element.querySelector('.progress-bar') as HTMLElement;
    this.statusEl = this.element.querySelector('.progress-status') as HTMLElement;
  }

  show(): void {
    document.body.appendChild(this.element);
    requestAnimationFrame(() => {
      this.element.classList.add('visible');
    });
  }

  async hide(): Promise<void> {
    this.element.classList.remove('visible');
    await new Promise(resolve => setTimeout(resolve, 300));
    this.element.remove();
  }

  updateProgress(written: number, total: number): void {
    const progress = (written / total) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.statusEl.textContent = `Flashing: ${Math.round(progress)}% (${written} / ${total} bytes)`;
  }

  setStatus(status: string): void {
    this.statusEl.textContent = status;
  }
}
