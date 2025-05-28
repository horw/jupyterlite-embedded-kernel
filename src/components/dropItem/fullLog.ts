import { ConsoleService } from "../../services/ConsoleService";

export class FullLogPanel {
    public text: string = "Full Log";
    private panel: HTMLDivElement | undefined;
    private content: HTMLDivElement | undefined;
    private header: HTMLDivElement | undefined;
    private isOpen: boolean = false;
    private isDragging: boolean = false;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private logContent: string = "";

    constructor(private consoleService: ConsoleService) {
        // Create panel elements
        this.createPanelElements();
        
        // Add drag functionality
        this.addDragHandlers();

        // Set up initial state
        if (this.panel) {
            this.panel.style.display = "none";
        }

        document.addEventListener('consoleTextChanged', (e) => {
            const customEvent = e as CustomEvent;
            this.updateLogContent()
            console.log('Custom event received. Text was changed:', customEvent.detail.text);
        });
        
    }

    private createPanelElements(): void {
        // Main panel container
        this.panel = document.createElement("div");
        this.panel.className = "full-log-panel";
        this.panel.style.position = "absolute";
        this.panel.style.width = "800px";
        this.panel.style.height = "600px";
        this.panel.style.backgroundColor = "#2b2b2b";
        this.panel.style.border = "1px solid #444";
        this.panel.style.borderRadius = "4px";
        this.panel.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
        this.panel.style.zIndex = "1000";
        this.panel.style.top = "100px";
        this.panel.style.left = "100px";
        this.panel.style.display = "flex";
        this.panel.style.flexDirection = "column";
        this.panel.style.overflow = "hidden";

        // Panel header
        this.header = document.createElement("div");
        this.header.className = "full-log-header";
        this.header.style.padding = "8px 12px";
        this.header.style.backgroundColor = "#3c3c3c";
        this.header.style.borderBottom = "1px solid #555";
        this.header.style.display = "flex";
        this.header.style.justifyContent = "space-between";
        this.header.style.alignItems = "center";
        this.header.style.cursor = "move";

        // Header title
        const title = document.createElement("span");
        title.textContent = "Console Log";
        title.style.fontWeight = "bold";
        title.style.color = "#e0e0e0";

        // Close button
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "×";
        closeBtn.style.background = "none";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#e0e0e0";
        closeBtn.style.fontSize = "20px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.padding = "0 5px";
        closeBtn.onclick = () => this.close();

        // Add title and close button to header
        this.header.appendChild(title);
        this.header.appendChild(closeBtn);

        // Content area for logs
        this.content = document.createElement("div");
        this.content.className = "full-log-content";
        this.content.style.flex = "1";
        this.content.style.padding = "12px";
        this.content.style.overflow = "auto";
        this.content.style.backgroundColor = "#1e1e1e";
        this.content.style.color = "#e0e0e0";
        this.content.style.fontFamily = "monospace";
        this.content.style.fontSize = "14px";
        this.content.style.whiteSpace = "pre-wrap";
        this.content.style.lineHeight = "1.5";

        // Add elements to panel
        this.panel.appendChild(this.header);
        this.panel.appendChild(this.content);

        // Add panel to document body
        document.body.appendChild(this.panel);
    }

    private addDragHandlers(): void {
        if (!this.header || !this.panel) return;
        
        this.header.addEventListener("mousedown", (e: MouseEvent) => {
            if (!this.panel) return;
            this.isDragging = true;
            this.offsetX = e.clientX - this.panel.getBoundingClientRect().left;
            this.offsetY = e.clientY - this.panel.getBoundingClientRect().top;
        });

        document.addEventListener("mousemove", (e: MouseEvent) => {
            if (!this.isDragging || !this.panel) return;
            
            const x = e.clientX - this.offsetX;
            const y = e.clientY - this.offsetY;
            
            // Keep panel within viewport bounds
            const maxX = window.innerWidth - this.panel.offsetWidth;
            const maxY = window.innerHeight - this.panel.offsetHeight;
            
            this.panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            this.panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        });

        document.addEventListener("mouseup", () => {
            this.isDragging = false;
        });
    }

    public action(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        // Update log content from ConsoleService
        this.updateLogContent();
        
        // Show the panel
        if (this.panel) {
            this.panel.style.display = "flex";
        }
        this.isOpen = true;
    }

    private close(): void {
        if (this.panel) {
            this.panel.style.display = "none";
        }
        this.isOpen = false;
    }

    private updateLogContent(): void {
        // Get the latest log content from ConsoleService
        this.logContent = this.consoleService.fullLog;
        
        // Update the content in the panel if it exists
        if (this.content) {
            this.content.textContent = this.logContent || "No log data available.";
            
            // Scroll to bottom
            this.content.scrollTop = this.content.scrollHeight;
        }
    }

    // Method to manually refresh the log content
    public refreshLog(): void {
        if (this.isOpen) {
            this.updateLogContent();
        }
    }
}