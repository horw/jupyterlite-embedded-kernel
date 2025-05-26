import {DeviceService} from "../../services/DeviceService";
import {FirmwareService} from "../../services/FirmwareService";

export class FlashDeviceUI {
    public text: string = "Flash Device";
    private dialogElement: HTMLDivElement | null = null;
    
    constructor(
        private deviceService: DeviceService,
        private firmwareService: FirmwareService
    ) {}

    public action() {
        // Create dialog panel if it doesn't exist yet
        if (!this.dialogElement) {
            this.createDialogPanel();
        }
        
        // Show the dialog
        this.showDialogPanel();
    }
    
    private createDialogPanel() {
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
        defaultDesc.style.margin = '0';
        defaultDesc.style.color = 'var(--jp-ui-font-color2, #757575)';
        defaultDesc.style.fontSize = '13px';
        
        const defaultButton = document.createElement('button');
        defaultButton.textContent = 'Flash Default';
        defaultButton.className = 'jp-panel-button';
        defaultButton.style.marginTop = '12px';
        defaultButton.style.padding = '8px 16px';
        defaultButton.style.backgroundColor = 'var(--jp-brand-color1, #2196F3)';
        defaultButton.style.color = 'white';
        defaultButton.style.border = 'none';
        defaultButton.style.borderRadius = '4px';
        defaultButton.style.cursor = 'pointer';
        defaultButton.style.fontSize = '13px';
        defaultButton.onclick = () => {
            this.flashDefaultFirmware();
            this.hideDialogPanel();
        };
        
        defaultOption.appendChild(defaultTitle);
        defaultOption.appendChild(defaultDesc);
        defaultOption.appendChild(defaultButton);
        
        // Custom Binary Option
        const customOption = document.createElement('div');
        customOption.className = 'panel';
        customOption.style.border = '1px solid var(--jp-border-color1, #E0E0E0)';
        customOption.style.borderRadius = '4px';
        customOption.style.padding = '16px';
        customOption.style.cursor = 'pointer';
        customOption.style.transition = 'background-color 0.2s ease, border-color 0.2s ease';
        
        const customTitle = document.createElement('h3');
        customTitle.textContent = 'Custom Binary';
        customTitle.style.margin = '0 0 8px 0';
        customTitle.style.fontSize = '15px';
        customTitle.style.color = 'var(--jp-ui-font-color0, #212121)';
        
        const customDesc = document.createElement('p');
        customDesc.textContent = 'Upload and flash your own binary file';
        customDesc.style.margin = '0';
        customDesc.style.color = 'var(--jp-ui-font-color2, #757575)';
        customDesc.style.fontSize = '13px';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.bin';
        fileInput.style.marginTop = '12px';
        fileInput.style.width = '100%';
        
        const customButton = document.createElement('button');
        customButton.textContent = 'Upload & Flash';
        customButton.className = 'jp-panel-button';
        customButton.style.marginTop = '12px';
        customButton.style.padding = '8px 16px';
        customButton.style.backgroundColor = 'var(--jp-brand-color1, #2196F3)';
        customButton.style.color = 'white';
        customButton.style.border = 'none';
        customButton.style.borderRadius = '4px';
        customButton.style.cursor = 'pointer';
        customButton.style.fontSize = '13px';
        customButton.onclick = () => {
            if (fileInput.files && fileInput.files.length > 0) {
                this.flashCustomBinary(fileInput.files[0]);
                this.hideDialogPanel();
            } else {
                alert('Please select a binary file first');
            }
        };
        
        customOption.appendChild(customTitle);
        customOption.appendChild(customDesc);
        customOption.appendChild(fileInput);
        customOption.appendChild(customButton);
        
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
        addHoverEffects(customOption);
        
        // Add options to container
        optionsContainer.appendChild(defaultOption);
        optionsContainer.appendChild(customOption);
        
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
    
    private showDialogPanel() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'block';
            // Log device and firmware info for debugging
            console.log('Device type:', this.deviceService.getDeviceType());
            console.log('Firmware options:', this.firmwareService.getFirmwareOptions());
        }
    }
    
    private hideDialogPanel() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'none';
        }
    }
    
    private flashDefaultFirmware() {
        // Implement default firmware flashing logic
        console.log('Flashing default firmware for device:', this.deviceService.getDeviceType());
        // Add actual implementation here
    }
    
    private flashCustomBinary(file: File) {
        // Implement custom binary flashing logic
        console.log('Flashing custom binary:', file.name);
        // Add actual implementation here
    }
}