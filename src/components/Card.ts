export interface CardProps {
  action: string;
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export class Card {
  protected element: HTMLElement;

  constructor(props: CardProps, onClick: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'welcome-card';
    this.element.setAttribute('data-action', props.action);
    this.update(props);
    this.element.addEventListener('click', onClick);
  }

  update(props: CardProps): void {
    this.element.innerHTML = `
      <div class="card-content">
        <span class="welcome-icon">${props.icon}</span>
        <div>
          <h3 class="card-title">${props.title}</h3>
          <p class="card-description">${props.description}</p>
        </div>
      </div>
    `;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
