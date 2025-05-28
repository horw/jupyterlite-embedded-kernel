import {EspControlPanelButton} from "./Toolbar";

export class Welcome {
    private static readonly STORAGE_KEY = 'welcome-hide-preference';
    public text: string = "Welcome";
    private welcomeElement: HTMLDivElement | null = null;
    
    constructor() {}

    /**
     * Checks if the welcome message should be shown based on localStorage
     */
    private shouldShowWelcome(): boolean {
        const hidePreference = localStorage.getItem(Welcome.STORAGE_KEY);
        return hidePreference !== 'true';
    }

    /**
     * Creates and displays the welcome message if it hasn't been dismissed
     */
    public showWelcome() {
        // If user chose not to see the welcome message, don't show it
        if (!this.shouldShowWelcome()) {
            return;
        }

        if (!this.welcomeElement) {
            this.createWelcomeElement();
        }

        if (this.welcomeElement) {
            document.body.appendChild(this.welcomeElement);
            this.welcomeElement.style.display = 'block';
        }
    }

    /**
     * Creates the welcome UI with message and checkbox
     */
    private createWelcomeElement() {
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'jp-welcome-overlay';
        overlay.style.display = 'none';
        
        // Set welcome content
        overlay.innerHTML = `
            <div class="jp-welcome-dialog">
                <header class="jp-welcome-header">
                    <h2 class="jp-welcome-title">Welcome to JupyterLite Embedded Kernel</h2>
                    <button class="jp-welcome-close-button jp-icon-hover" id="welcome-dialog-close" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                            <path class="jp-icon3" fill="#616161" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </header>
                <div class="jp-welcome-content">
                    <p>Thank you for using JupyterLite Embedded Kernel! Here's how to get started:</p>
                    <ul>
                        <li>Use the <span class="jp-welcome-inline-button">${EspControlPanelButton}</span> in the toolbar to interact with your device</li>
                        <li>Connect to your device using the Connect Device option</li>
                        <li>Flash firmware to your device with the Flash Device tool</li>
                        <li>Create new notebooks to write and execute code</li>
                        <li>Use the device's capabilities directly from your notebooks</li>
                        <li>If you found some issue or way to improve, please open it in  <a href="https://github.com/espressif/jupyter-lite-micropython/issues"> GitHub</a></li>
                    </ul>
                    <div class="jp-welcome-checkbox-container">
                        <label class="jp-welcome-checkbox-label">
                            <input type="checkbox" id="welcome-hide-checkbox" class="jp-welcome-checkbox">
                            <span>Don't show this message again</span>
                        </label>
                    </div>
                    <div class="jp-welcome-button-container">
                        <button class="jp-Button jp-mod-accept jp-mod-styled" id="welcome-got-it-button">Got it!</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.welcomeElement = overlay;
        
        // Add event listeners
        const closeButton = overlay.querySelector('#welcome-dialog-close');
        const gotItButton = overlay.querySelector('#welcome-got-it-button');
        const checkbox = overlay.querySelector('#welcome-hide-checkbox') as HTMLInputElement;
        
        if (closeButton) {
            closeButton.addEventListener('click', () => this.handleClose(checkbox));
        }
        
        if (gotItButton) {
            gotItButton.addEventListener('click', () => this.handleClose(checkbox));
        }
        
        // Close when clicking outside the welcome dialog
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.handleClose(checkbox);
            }
        });
        
        // Add CSS styles
        this.addStyles();
    }
    
    /**
     * Handles the closing of the welcome dialog
     */
    private handleClose(checkbox: HTMLInputElement | null) {
        if (checkbox && checkbox.checked) {
            localStorage.setItem(Welcome.STORAGE_KEY, 'true');
        }
        
        this.hideWelcome();
    }
    
    /**
     * Hides the welcome dialog
     */
    private hideWelcome() {
        if (this.welcomeElement) {
            this.welcomeElement.style.display = 'none';
            if (this.welcomeElement.parentNode) {
                this.welcomeElement.parentNode.removeChild(this.welcomeElement);
            }
        }
    }
    
    /**
     * Adds CSS styles for the welcome component
     */
    private addStyles() {
        const styleId = 'jp-welcome-styles';
        
        // Check if styles already exist
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .jp-welcome-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: var(--jp-modal-background, rgba(0, 0, 0, 0.6));
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }
                
                .jp-welcome-dialog {
                    background-color: var(--jp-layout-color1, white);
                    border-radius: 2px;
                    box-shadow: var(--jp-elevation-z20, 0 2px 12px 0 rgba(0, 0, 0, 0.2));
                    width: 100%;
                    max-width: 560px;
                    max-height: 90vh;
                    overflow-y: auto;
                    border-top: 3px solid var(--jp-brand-color1, #2196F3);
                    display: flex;
                    flex-direction: column;
                }
                
                .jp-welcome-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background-color: var(--jp-layout-color1, white);
                    border-bottom: 1px solid var(--jp-border-color1, #E0E0E0);
                }
                
                .jp-welcome-title {
                    margin: 0;
                    color: var(--jp-ui-font-color0, #000);
                    font-size: var(--jp-ui-font-size2, 1.2em);
                    font-weight: 600;
                    font-family: var(--jp-ui-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif);
                }
                
                .jp-welcome-close-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                }
                
                .jp-welcome-close-button:hover {
                    background-color: var(--jp-layout-color2, #EEEEEE);
                }
                
                .jp-welcome-content {
                    padding: 16px;
                    font-family: var(--jp-ui-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif);
                    font-size: var(--jp-ui-font-size1, 13px);
                    color: var(--jp-ui-font-color1, rgba(0,0,0,.87));
                    line-height: 1.5;
                }
                
                .jp-welcome-content p {
                    margin-top: 0;
                    margin-bottom: 12px;
                }
                
                .jp-welcome-content ul {
                    padding-left: 24px;
                    margin: 12px 0;
                }
                
                .jp-welcome-content li {
                    margin-bottom: 8px;
                }
                
                .jp-welcome-checkbox-container {
                    margin-top: 20px;
                }
                
                .jp-welcome-checkbox-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    font-size: var(--jp-ui-font-size1, 13px);
                    color: var(--jp-ui-font-color2, #616161);
                }
                
                .jp-welcome-checkbox {
                    margin-right: 8px;
                }
                
                .jp-welcome-button-container {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                    padding-top: 12px;
                    border-top: 1px solid var(--jp-border-color1, #E0E0E0);
                }
                
                .jp-Button.jp-mod-accept.jp-mod-styled {
                    background-color: var(--jp-brand-color1, #2196F3);
                    color: white;
                    border: none;
                    border-radius: 2px;
                    padding: 6px 16px;
                    cursor: pointer;
                    font-weight: 500;
                    font-family: var(--jp-ui-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif);
                    font-size: var(--jp-ui-font-size1, 13px);
                    transition: background-color 0.1s ease;
                }
                
                .jp-Button.jp-mod-accept.jp-mod-styled:hover {
                    background-color: var(--jp-brand-color0, #1976D2);
                }
                
                /* Inline button styling */
                .jp-welcome-inline-button {
                    display: inline-flex;
                    vertical-align: middle;
                }
                
                .jp-welcome-inline-button .jp-ToolbarButton {
                    font-size: inherit;
                    height: auto;
                    transform-origin: left center;
                    display: inline-flex;
                    border: 1px solid var(--jp-border-color1);
                    background-color: var(--jp-layout-color1);
                    box-shadow: var(--jp-elevation-z1);
                    white-space: nowrap;
                }
                
                .jp-welcome-inline-button .jp-ToolbarButtonComponent-label {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `;
            document.head.appendChild(style);
        }
    }
}
