import {ServiceContainer} from "../services/ServiceContainer";

export function addButtonToToolbarElement(toolbar: Element, serviceContainer: ServiceContainer ): void {
  const div = document.createElement('div');
  div.className = "lm-Widget jp-CommandToolbarButton jp-Toolbar-item dropdown-container";
  div.style.position = 'relative';

  const button = document.createElement('button');
  button.className = 'jp-ToolbarButton jp-Toolbar-item';
  button.title = 'ESP Options';
  button.style.background = 'var(--jp-layout-color1)';
  button.style.borderRadius = '2px';
  button.style.border = 'none';
  button.style.padding = '0px 6px';
  button.style.height = '24px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.cursor = 'pointer';
  button.style.transition = 'background-color 0.1s ease';

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
  textSpan.textContent = 'ESP Control Panel';
  textSpan.className = 'jp-ToolbarButtonComponent-label';
  textSpan.style.fontSize = '13px';
  textSpan.style.padding = '0 2px';
  textSpan.style.color = 'var(--jp-ui-font-color1)';

  // Add caret down icon for dropdown
  const caretSpan = document.createElement('span');
  caretSpan.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 18 18" data-icon="ui-components:caret-down-empty" style="vertical-align: middle;">
    <path fill="#616161" d="M5.2 5.9 9 9.7l3.8-3.8L14 7.1l-4.9 5-4.9-5z" class="jp-icon3" shape-rendering="geometricPrecision"></path>
  </svg>
  `

  button.appendChild(logoContainer);
  button.appendChild(textSpan);
  button.appendChild(caretSpan);

  // Create dropdown content
  const dropdownContent = document.createElement('div');
  dropdownContent.className = 'jp-Menu';
  dropdownContent.style.display = 'none';
  dropdownContent.style.position = 'absolute';
  dropdownContent.style.top = '100%';
  dropdownContent.style.left = '0';
  dropdownContent.style.backgroundColor = 'var(--jp-layout-color1, white)';
  dropdownContent.style.minWidth = '180px';
  dropdownContent.style.boxShadow = '0px 1px 6px rgba(0, 0, 0, 0.2)';
  dropdownContent.style.border = '1px solid var(--jp-border-color1, #E0E0E0)';
  dropdownContent.style.zIndex = '10000';
  dropdownContent.style.margin = '0';
  dropdownContent.style.padding = '4px 0';
  dropdownContent.style.overflow = 'auto';
  
  const items = [
    { text: 'Flash connect', action: () => {
      console.log('Flash connect selected');
    }},
    { text: 'Reset', action: () => {
      console.log('Reset selected');
    }}
  ];
  
  items.forEach((item, index) => {
    const option = document.createElement('div');
    option.className = 'jp-Menu-item';
    option.setAttribute('role', 'menuitem');
    option.setAttribute('tabindex', '-1');
    option.textContent = ` ${item.text}`;
    option.style.padding = '6px 12px';
    option.style.fontSize = '13px';
    option.style.fontFamily = 'var(--jp-ui-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif)';
    option.style.color = 'var(--jp-ui-font-color1, rgba(0,0,0,.87))';
    option.style.cursor = 'pointer';
    option.style.display = 'flex';
    option.style.alignItems = 'center';
    option.style.lineHeight = '1.4';
    option.style.whiteSpace = 'nowrap';
    option.style.userSelect = 'none';
    option.style.transition = 'background-color 0.1s ease';
    
    // Add a keyboard shortcut container (Jupyter style often shows keyboard shortcuts)
    if (index === 0) {
      const shortcutContainer = document.createElement('div');
      shortcutContainer.className = 'jp-Menu-itemShortcut';
      shortcutContainer.textContent = 'F';
      shortcutContainer.style.paddingLeft = '12px';
      shortcutContainer.style.textAlign = 'right';
      shortcutContainer.style.flexGrow = '1';
      shortcutContainer.style.color = 'var(--jp-ui-font-color2, rgba(0,0,0,.54))';
      shortcutContainer.style.fontSize = '12px';
      option.appendChild(shortcutContainer);
    } else if (index === 1) {
      const shortcutContainer = document.createElement('div');
      shortcutContainer.className = 'jp-Menu-itemShortcut';
      shortcutContainer.textContent = 'R';
      shortcutContainer.style.paddingLeft = '12px';
      shortcutContainer.style.textAlign = 'right';
      shortcutContainer.style.flexGrow = '1';
      shortcutContainer.style.color = 'var(--jp-ui-font-color2, rgba(0,0,0,.54))';
      shortcutContainer.style.fontSize = '12px';
      option.appendChild(shortcutContainer);
    }
    
    option.addEventListener('mouseover', () => {
      option.style.backgroundColor = 'var(--jp-layout-color2, #EEEEEE)';
    });
    
    option.addEventListener('mouseout', () => {
      option.style.backgroundColor = '';
    });
    
    option.onclick = (e) => {
      e.preventDefault();
      item.action();
      dropdownContent.style.display = 'none';
    };
    
    dropdownContent.appendChild(option);
  });
  
  // Toggle dropdown on button click
  button.onclick = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    const isVisible = dropdownContent.style.display === 'block';
    dropdownContent.style.display = isVisible ? 'none' : 'block';
  };
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!div.contains(e.target as Node)) {
      dropdownContent.style.display = 'none';
    }
  });

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'var(--jp-layout-color2)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'var(--jp-layout-color1)';
  });

  button.addEventListener('mousedown', () => {
    button.style.backgroundColor = 'var(--jp-layout-color3)';
  });

  button.addEventListener('mouseup', () => {
    button.style.backgroundColor = 'var(--jp-layout-color2)';
  });

  div.appendChild(button);
  div.appendChild(dropdownContent);

  toolbar.insertBefore(div, toolbar.firstChild);
}

