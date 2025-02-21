import sys
import base64
import urllib.request
import os

def download_and_convert():
    url = "https://micropython.org/resources/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin"
    print(f"Downloading firmware from {url}...")
    
    try:
        firmware = urllib.request.urlopen(url).read()
        print(f"Downloaded {len(firmware)} bytes")
        
        # Save raw firmware binary
        firmware_path = "public/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin"
        os.makedirs(os.path.dirname(firmware_path), exist_ok=True)
        
        with open(firmware_path, "wb") as f:
            f.write(firmware)
            
        print(f"Successfully wrote firmware binary to {firmware_path}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    download_and_convert()
