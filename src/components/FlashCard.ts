import { Card, CardProps } from './Card';
import { FirmwareService } from '../services/FirmwareService';
import { DeviceService } from '../services/DeviceService';

export class FlashCard extends Card {
  // Core elements
  private cardContent!: HTMLDivElement;
  private tabContainer!: HTMLDivElement;
  private contentContainer!: HTMLDivElement;
  
  // Tab elements
  private defaultTab!: HTMLDivElement;
  private customTab!: HTMLDivElement;
  
  // Content panels
  private defaultPanel!: HTMLDivElement;
  private customPanel!: HTMLDivElement;
  
  // Input elements
  private firmwareSelect!: HTMLSelectElement;
  private fileInput!: HTMLInputElement;
  private fileLabel!: HTMLLabelElement;
  private fileDisplay!: HTMLDivElement;
  
  // State tracking
  private activeTab: 'default' | 'custom' = 'default';
  private selectedFile: File | null = null;

  constructor(
    props: CardProps,
    onClick: () => void,
    private firmwareService: FirmwareService,
    private deviceService: DeviceService
  ) {
    super(props, onClick);
    this.initializeCard();
  }

  private initializeCard(): void {
    this.deviceService.getTransport();
    this.setupCardStructure();
    this.createTabs();
    this.createPanels();
    this.setupEventListeners();
    this.showTab('default');
  }
  
  private setupCardStructure(): void {
    this.cardContent = this.element.querySelector('.card-content') as HTMLDivElement;
    
    // Create card structure
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // We'll use the standard card title that's already set in the update method

    // Create option selection container (replacing tabs with vertical layout)
    const optionSelectionContainer = document.createElement('div');
    optionSelectionContainer.className = 'flash-options-container';
    
    // Create option selector
    this.tabContainer = document.createElement('div');
    this.tabContainer.className = 'firmware-option-selector';
    
    // Create content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'firmware-content';
    
    optionSelectionContainer.appendChild(this.tabContainer);
    optionSelectionContainer.appendChild(this.contentContainer);

    // Add all elements to the card
    cardBody.appendChild(optionSelectionContainer);

    this.cardContent.appendChild(cardBody);
  }

  private createTabs(): void {
    // Default firmware tab (now a vertical option)
    this.defaultTab = document.createElement('div');
    this.defaultTab.className = 'tab';
    this.defaultTab.innerHTML = `
      <span class="tab-icon">🔄</span>
      <div class="tab-content-info">
        <div class="tab-title">Default Firmware</div>
        <div class="tab-description">Use pre-built firmware for your device</div>
      </div>
    `;
    this.defaultTab.addEventListener('click', () => this.showTab('default'));
    
    // Custom binary tab (now a vertical option)
    this.customTab = document.createElement('div');
    this.customTab.className = 'tab';
    this.customTab.innerHTML = `
      <span class="tab-icon">📁</span>
      <div class="tab-content-info">
        <div class="tab-title">Custom Binary</div>
        <div class="tab-description">Upload your own binary file</div>
      </div>
    `;
    this.customTab.addEventListener('click', () => this.showTab('custom'));
    
    // Add tabs to the container vertically
    this.tabContainer.appendChild(this.defaultTab);
    this.tabContainer.appendChild(this.customTab);
  }
  
  private createPanels(): void {
    // Default firmware panel
    this.defaultPanel = document.createElement('div');
    this.defaultPanel.className = 'panel default-panel';
    
    // Add descriptive text
    const defaultDescription = document.createElement('div');
    defaultDescription.className = 'panel-description';
    defaultDescription.innerHTML = `
      <p>Select from pre-built firmware options for common ESP32 devices.</p>
      <p>The firmware will be downloaded and flashed to your device.</p>
    `;
    
    // Create firmware selector with enhanced UI
    const selectContainer = document.createElement('div');
    selectContainer.className = 'select-container';
    
    const selectLabel = document.createElement('label');
    selectLabel.textContent = 'Select Firmware:';
    selectLabel.htmlFor = 'firmware-select';
    
    this.firmwareSelect = document.createElement('select');
    this.firmwareSelect.id = 'firmware-select';
    
    // Add auto-detect option first
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = '🔍 Auto-detect (Recommended)';
    this.firmwareSelect.appendChild(autoOption);
    
    // Add a divider
    const divider = document.createElement('option');
    divider.disabled = true;
    divider.textContent = '──────────────────';
    this.firmwareSelect.appendChild(divider);
    
    // Add firmware options from service
    const firmwareOptions = this.firmwareService.getFirmwareOptions();
    Object.entries(firmwareOptions).forEach(([id, option]) => {
      if (id !== 'auto') { // Skip auto since we already added it
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = option.name || id;
        this.firmwareSelect.appendChild(opt);
      }
    });
    
    // Set initial value (prefer auto if available)
    this.firmwareSelect.value = 'auto';
    
    selectContainer.appendChild(selectLabel);
    selectContainer.appendChild(this.firmwareSelect);
    
    // Add description about auto-detect
    const autoDetectInfo = document.createElement('div');
    autoDetectInfo.className = 'auto-detect-info';
    autoDetectInfo.innerHTML = `
      <div class="info-icon">ℹ️</div>
      <div class="info-text">
        Auto-detect will automatically select the appropriate firmware based on your connected device.
      </div>
    `;
    
    this.defaultPanel.appendChild(defaultDescription);
    this.defaultPanel.appendChild(selectContainer);
    this.defaultPanel.appendChild(autoDetectInfo);
    
    // Custom binary panel with enhanced UI
    this.customPanel = document.createElement('div');
    this.customPanel.className = 'panel custom-panel';
    
    // Add descriptive text
    const customDescription = document.createElement('div');
    customDescription.className = 'panel-description';
    customDescription.innerHTML = `
      <p>Upload your own binary file to flash directly to the device.</p>
      <p>Use this option for custom firmware builds or specific applications.</p>
    `;
    
    // Create upload container with better styling
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'upload-container';
    
    // File input for binary upload
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.id = 'binary-file';
    this.fileInput.accept = '.bin';
    this.fileInput.style.display = 'none';
    
    this.fileLabel = document.createElement('label');
    this.fileLabel.htmlFor = 'binary-file';
    this.fileLabel.className = 'file-button';
    this.fileLabel.innerHTML = '<span class="upload-icon">📂</span> Choose Binary File';
    
    this.fileDisplay = document.createElement('div');
    this.fileDisplay.className = 'file-display';
    this.fileDisplay.innerHTML = '<span class="file-status">No file selected</span>';
    
    // Add file format hint
    const fileHint = document.createElement('div');
    fileHint.className = 'file-hint';
    fileHint.textContent = 'Supported format: .bin files';
    
    uploadContainer.appendChild(this.fileInput);
    uploadContainer.appendChild(this.fileLabel);
    uploadContainer.appendChild(this.fileDisplay);
    uploadContainer.appendChild(fileHint);
    
    this.customPanel.appendChild(customDescription);
    this.customPanel.appendChild(uploadContainer);
    
    // Add panels to content container
    this.contentContainer.appendChild(this.defaultPanel);
    this.contentContainer.appendChild(this.customPanel);
  }
  
  private setupEventListeners(): void {
    // Handle file selection with enhanced UI feedback
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0] || null;
      this.selectedFile = file;
      
      if (file) {
        // Enhanced display with icon and formatting
        this.fileDisplay.innerHTML = `
          <span class="file-selected-icon">✓</span>
          <span class="file-selected-name">${file.name}</span>
          <span class="file-selected-size">(${this.formatFileSize(file.size)})</span>
        `;
        this.fileDisplay.classList.add('file-selected');
      } else {
        this.fileDisplay.innerHTML = '<span class="file-status">No file selected</span>';
        this.fileDisplay.classList.remove('file-selected');
      }
    });
    
    // Handle firmware selection with feedback
    this.firmwareSelect.addEventListener('change', () => {
      // Only update service if method exists
      if (typeof this.firmwareService.setSelectedFirmwareId === 'function') {
        this.firmwareService.setSelectedFirmwareId(this.firmwareSelect.value);
      }
      
      // Update UI based on selection
      const selectedOption = this.firmwareSelect.options[this.firmwareSelect.selectedIndex];
      console.log(`Firmware selected: ${selectedOption.textContent} (${this.firmwareSelect.value})`);
    });
    
    // Add hover effects for better user feedback
    this.fileLabel.addEventListener('mouseover', () => {
      this.fileLabel.style.backgroundColor = '#0069d9';
    });
    
    this.fileLabel.addEventListener('mouseout', () => {
      this.fileLabel.style.backgroundColor = '#007bff';
    });
    
    // Stop click propagation (prevent card click)
    this.tabContainer.addEventListener('click', e => e.stopPropagation());
    this.contentContainer.addEventListener('click', e => e.stopPropagation());
    
  }
  
  private showTab(tab: 'default' | 'custom'): void {
    this.activeTab = tab;
    
    // Update option appearance with animation
    this.defaultTab.classList.toggle('active', tab === 'default');
    this.customTab.classList.toggle('active', tab === 'custom');
    
    // First hide both panels
    this.defaultPanel.style.display = 'none';
    this.customPanel.style.display = 'none';
    
    // Then show the selected panel with a slight delay for smoother transition
    setTimeout(() => {
      if (tab === 'default') {
        this.defaultPanel.style.display = 'block';
        this.defaultPanel.style.opacity = '0';
        setTimeout(() => { this.defaultPanel.style.opacity = '1'; }, 50);
      } else {
        this.customPanel.style.display = 'block';
        this.customPanel.style.opacity = '0';
        setTimeout(() => { this.customPanel.style.opacity = '1'; }, 50);
      }
    }, 50);
    
    // Log the option change
    console.log(`Flash option changed to: ${tab}`);
  }
  
  // Utility method for file size display
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  // Get current state data
  getFlashData(): { mode: 'default' | 'custom', firmwareId?: string, file?: File } {
    if (this.activeTab === 'default') {
      return {
        mode: 'default',
        firmwareId: this.firmwareSelect.value
      };
    } else {
      return {
        mode: 'custom',
        file: this.selectedFile || undefined
      };
    }
  }
  
  // Override from parent class
  update(props: CardProps): void {
    // Always set the title to "Flash Device" regardless of props
    this.element.innerHTML = `
      <div class="card-content">
        <div class="card-header">
          <span class="welcome-icon">${props.icon}</span>
          <div>
            <h3 class="card-title">Flash Device</h3>
            <p class="card-description">Flash your device with the latest firmware</p>
          </div>
        </div>
      </div>
    `;
    
    // Re-initialize after update
    setTimeout(() => this.initializeCard(), 0);
  }
}