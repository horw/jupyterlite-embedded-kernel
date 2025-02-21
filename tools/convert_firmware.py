import sys
import base64
import urllib.request

def download_and_convert():
    url = "https://micropython.org/resources/firmware/ESP32_GENERIC_C3-20241129-v1.24.1.bin"
    print(f"Downloading firmware from {url}...")
    
    try:
        firmware = urllib.request.urlopen(url).read()
        print(f"Downloaded {len(firmware)} bytes")
        
        # Convert to TypeScript array format
        hex_bytes = [f"0x{b:02X}" for b in firmware]
        chunks = [hex_bytes[i:i+12] for i in range(0, len(hex_bytes), 12)]
        array_content = ",\n        ".join(", ".join(chunk) for chunk in chunks)
        
        ts_code = f"""// Embedded MicroPython firmware for ESP32-C3
export const MICROPYTHON_FIRMWARE = {{
    name: 'ESP32_GENERIC_C3-20241129-v1.24.1.bin',
    data: new Uint8Array([
        {array_content}
    ]).buffer
}};"""
        
        with open("src/firmware.ts", "w") as f:
            f.write(ts_code)
            
        print("Successfully wrote firmware data to src/firmware.ts")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    download_and_convert()
