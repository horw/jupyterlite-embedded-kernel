## What is this project about?

This kernel is used in Jupyter Notebook to help users get started with embedded devices, especially with ESP32 products.

## How to Work with This Project

### Environment Setup

To set up your environment, simply run:

```bash
nvm use
```

1. Install Jupyter and project-related dependencies:

```bash
python -m pip install .[dev]
```

2. Install Node.js modules:

```bash
jlpm
```

3. Build the extension:

```bash
jlpm build
```

4. Build JupyterLite static files:

```bash
jlpm build:static
```

5. Serve the files:

```bash
jlpm serve
```

If you change any files, you should rebuild the project and regenerate the static files (repeat steps 3, 4, and 5).
