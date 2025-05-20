import WelcomePanel from "../panel";

export function addButtonToToolbarElement(toolbar: Element, welcomePanel: WelcomePanel): void {
  const div = document.createElement('div');
  div.className = "lm-Widget jp-CommandToolbarButton jp-Toolbar-item";

  const button = document.createElement('button');
  button.className = 'jp-ToolbarButton jp-Toolbar-item jp-Download-button';
  button.title = 'Show ESP control panel';
  button.onclick = () => {
    welcomePanel.show()
  };

  const logoContainer = document.createElement('div');
  logoContainer.className = 'esp-logo-container';

  const logoImg = document.createElement('img');
  logoImg.src = 'https://www.cdnlogo.com/logos/e/41/espressif-systems.svg';
  logoImg.alt = 'ESP';
  logoImg.className = 'esp-logo';
  logoImg.width = 20;
  logoImg.height = 20;


  logoContainer.appendChild(logoImg);

  const textSpan = document.createElement('span');
  textSpan.textContent = 'Control panel';
  textSpan.className = 'esp-button-text';

  button.appendChild(logoContainer);
  button.appendChild(textSpan);

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = 'var(--ui-shadow-md, 0 8px 24px rgba(28, 28, 40, 0.12))';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'var(--ui-shadow-sm, 0 2px 8px rgba(28, 28, 40, 0.08))';
  });

  button.addEventListener('mousedown', () => {
    button.style.transform = 'scale(0.96)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-1px)';
  });

  div.appendChild(button)

  toolbar.insertBefore(div, toolbar.firstChild);
}

