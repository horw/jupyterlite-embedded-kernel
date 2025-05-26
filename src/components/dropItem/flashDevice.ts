import {DeviceService} from "../../services/DeviceService";
import {FirmwareService} from "../../services/FirmwareService";
import {FlashService} from "../../services/FlashService";
import '/style/custom.css';

export class FlashDeviceUI {
    public text: string = "Flash Device";
    private dialogElement: HTMLDivElement | null = null;
    
    constructor(
        private deviceService: DeviceService,
        private firmwareService: FirmwareService,
        private flashService: FlashService
    ) {}

    public action() {
        if (!this.dialogElement) {
            this.createDialogPanel();
        }
        this.showDialogPanel();
    }
    
    public createDialogPanel() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'none';
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'welcome-dialog';
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = 'var(--jp-layout-color1, white)';
        dialog.style.borderRadius = '8px';
        dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        dialog.style.padding = '24px';
        dialog.style.maxWidth = '500px';
        dialog.style.width = '90%';
        dialog.style.zIndex = '10001';
        dialog.style.maxHeight = '80vh';
        dialog.style.overflowY = 'auto';
        
        // Create header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '16px';
        
        const title = document.createElement('h2');
        title.textContent = 'Flash Device';
        title.style.margin = '0';
        title.style.fontSize = '18px';
        title.style.fontWeight = 'bold';
        title.style.color = 'var(--jp-ui-font-color0, #212121)';
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.background = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = 'var(--jp-ui-font-color2, #757575)';
        closeButton.style.padding = '0';
        closeButton.style.width = '24px';
        closeButton.style.height = '24px';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.onclick = () => this.hideDialogPanel();
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Create description
        const description = document.createElement('p');
        description.textContent = 'Flash your device with the latest firmware';
        description.style.margin = '0 0 20px 0';
        description.style.color = 'var(--jp-ui-font-color2, #757575)';
        
        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexDirection = 'column';
        optionsContainer.style.gap = '16px';
        
        // Default Firmware Option
        const defaultOption = document.createElement('div');
        defaultOption.className = 'panel';
        defaultOption.style.border = '1px solid var(--jp-border-color1, #E0E0E0)';
        defaultOption.style.borderRadius = '4px';
        defaultOption.style.padding = '16px';
        defaultOption.style.cursor = 'pointer';
        defaultOption.style.transition = 'background-color 0.2s ease, border-color 0.2s ease';
        
        const defaultTitle = document.createElement('h3');
        defaultTitle.textContent = 'Default Firmware';
        defaultTitle.style.margin = '0 0 8px 0';
        defaultTitle.style.fontSize = '15px';
        defaultTitle.style.color = 'var(--jp-ui-font-color0, #212121)';
        
        const defaultDesc = document.createElement('p');
        defaultDesc.textContent = 'Use the recommended firmware for your device';
        defaultDesc.style.margin = '0 0 16px 0';
        defaultDesc.style.color = 'var(--jp-ui-font-color2, #757575)';
        defaultDesc.style.fontSize = '13px';
        
        // Get firmware options and create selection UI
        const firmwareOptions = this.firmwareService.getFirmwareOptions();
        const firmwareKeys = Object.keys(firmwareOptions);
        
        // Create firmware selection container
        const firmwareSelectContainer = document.createElement('div');
        firmwareSelectContainer.style.marginBottom = '16px';
        
        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Select firmware:';
        selectLabel.style.display = 'block';
        selectLabel.style.marginBottom = '8px';
        selectLabel.style.fontSize = '13px';
        selectLabel.style.color = 'var(--jp-ui-font-color1, #424242)';
        
        const firmwareSelect = document.createElement('select');
        firmwareSelect.style.width = '100%';
        firmwareSelect.style.padding = '8px';
        firmwareSelect.style.borderRadius = '4px';
        firmwareSelect.style.border = '1px solid var(--jp-border-color1, #E0E0E0)';
        firmwareSelect.style.backgroundColor = 'var(--jp-layout-color1, white)';
        firmwareSelect.style.color = 'var(--jp-ui-font-color0, #212121)';
        firmwareSelect.style.fontSize = '13px';
        
        // Add firmware options to select dropdown
        firmwareKeys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = firmwareOptions[key].name || key;
            
            // Set auto as default if available, otherwise first option
            if (key === 'auto') {
                option.selected = true;
            }
            
            firmwareSelect.appendChild(option);
        });
        
        // Add firmware description element that updates when selection changes
        const firmwareDescription = document.createElement('div');
        firmwareDescription.style.marginTop = '8px';
        firmwareDescription.style.fontSize = '12px';
        firmwareDescription.style.color = 'var(--jp-ui-font-color2, #757575)';
        firmwareDescription.style.fontStyle = 'italic';
        
        // Function to update description based on selection
        const updateFirmwareDescription = () => {
            const selectedKey = firmwareSelect.value;
            const selectedOption = firmwareOptions[selectedKey];
            
            if (selectedKey === 'auto') {
                firmwareDescription.textContent = 'Automatically detects your device type and selects the appropriate firmware';
            } else if (selectedOption) {
                firmwareDescription.textContent = `Firmware for ${selectedOption.name || selectedKey}`;
            } else {
                firmwareDescription.textContent = `Firmware for ${selectedKey}`;
            }
        };
        
        // Set initial description
        updateFirmwareDescription();
        
        // Update description when selection changes
        firmwareSelect.addEventListener('change', updateFirmwareDescription);
        
        firmwareSelectContainer.appendChild(selectLabel);
        firmwareSelectContainer.appendChild(firmwareSelect);
        firmwareSelectContainer.appendChild(firmwareDescription);
        
        const defaultButton = document.createElement('button');
        defaultButton.textContent = 'Flash Selected Firmware';
        defaultButton.className = 'jp-panel-button';
        defaultButton.style.padding = '8px 16px';
        defaultButton.style.backgroundColor = 'var(--jp-brand-color1, #2196F3)';
        defaultButton.style.color = 'white';
        defaultButton.style.border = 'none';
        defaultButton.style.borderRadius = '4px';
        defaultButton.style.cursor = 'pointer';
        defaultButton.style.fontSize = '13px';
        defaultButton.style.width = '100%';
        defaultButton.onclick = () => {
            const selectedFirmwareId = firmwareSelect.value;
            this.flashDefaultFirmware(selectedFirmwareId);
            this.hideDialogPanel();
        };
        
        defaultOption.appendChild(defaultTitle);
        defaultOption.appendChild(defaultDesc);
        defaultOption.appendChild(firmwareSelectContainer);
        defaultOption.appendChild(defaultButton);
        
        // Add hover effects
        const addHoverEffects = (element: HTMLElement) => {
            element.addEventListener('mouseenter', () => {
                element.style.backgroundColor = 'var(--jp-layout-color2, #EEEEEE)';
                element.style.borderColor = 'var(--jp-brand-color1, #2196F3)';
            });
            element.addEventListener('mouseleave', () => {
                element.style.backgroundColor = 'var(--jp-layout-color1, white)';
                element.style.borderColor = 'var(--jp-border-color1, #E0E0E0)';
            });
        };
        
        addHoverEffects(defaultOption);

        // Add options to container
        optionsContainer.appendChild(defaultOption);

        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(description);
        dialog.appendChild(optionsContainer);
        
        // Add dialog to overlay
        overlay.appendChild(dialog);
        
        // Add overlay to body
        document.body.appendChild(overlay);
        
        // Store reference to the dialog element
        this.dialogElement = overlay;
        
        // Close dialog when clicking on overlay background
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideDialogPanel();
            }
        });
    }
    
    public showDialogPanel() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'block';
            console.log('Device type:', this.deviceService.getDeviceType());
            console.log('Firmware options:', this.firmwareService.getFirmwareOptions());
        }
    }
    
    private hideDialogPanel() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'none';
        }
    }
    
    private flashDefaultFirmware(firmwareId: string) {
        this.firmwareService.setSelectedFirmwareId(firmwareId);
        this.flashService.flashDevice();
    }
}