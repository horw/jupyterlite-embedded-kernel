from setuptools import setup

setup(
    name="jupyterlite_embedded_kernel",
    version="0.1.0",
    packages=["jupyterlite_embedded_kernel"],
    install_requires=[
        "jupyterlab>=4.0.0,<5.0.0",
    ],
    package_data={"jupyterlite_embedded_kernel": ["labextension/*"]},
)