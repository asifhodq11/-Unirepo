import socket
import requests
import time

def check_dns(hostname):
    print(f"[*] Checking DNS for {hostname}...")
    try:
        ip = socket.gethostbyname(hostname)
        print(f"[+] Success: {hostname} resolved to {ip}")
        return True
    except socket.gaierror:
        print(f"[!] Error: Unable to resolve {hostname}. This is a DNS or local network block.")
        return False

def check_http(url):
    print(f"[*] Checking HTTP Connectivity to {url}...")
    try:
        start = time.time()
        res = requests.get(url, timeout=5)
        duration = int((time.time() - start) * 1000)
        print(f"[+] Success: {url} returned {res.status_code} in {duration}ms")
        return True
    except Exception as e:
        print(f"[!] Error: {url} failed. {str(e)}")
        return False

if __name__ == "__main__":
    print("=== ReplyIQ Connectivity Diagnostic ===")
    targets = [
        "tpbfalmllkxadwfredau.supabase.co",
        "openai.com",
    ]
    
    dns_ok = True
    for t in targets:
        if not check_dns(t):
            dns_ok = False
            
    print("\n--- Summary ---")
    if dns_ok:
        print("DNS appears fine. If the app still fails, check your VPN/Proxy settings.")
    else:
        print("CRITICAL: DNS resolution failed ('getaddrinfo').")
        print("Try these steps:")
        print("1. Restart your router / toggle WiFi.")
        print("2. Check if other AI tools (Paperclip/OpenCode) are currently running.")
        print("3. Try changing your DNS for better reliability (e.g., 8.8.8.8).")
    
    print("\n[*] Checking HTTP Latency...")
    check_http("https://tpbfalmllkxadwfredau.supabase.co/rest/v1/")
    
    print("========================================")
