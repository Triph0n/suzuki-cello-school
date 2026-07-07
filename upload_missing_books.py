import os
import subprocess
import json
import sys
import urllib.request
import urllib.parse

def main():
    if len(sys.argv) < 2:
        print("Použití: python upload_missing_books.py <jmeno-r2-bucketu>")
        print("\nNapříklad: python upload_missing_books.py suzuki-cello-media")
        sys.exit(1)
        
    bucket = sys.argv[1]
    manifest_path = os.path.join('src', 'mediaManifest.json')
    if not os.path.exists(manifest_path):
        print("Chyba: src/mediaManifest.json neexistuje!")
        sys.exit(1)
        
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    # Shromáždíme všechny lokální soubory z manifestu
    all_files = []
    for category, files_dict in manifest.items():
        for key, path in files_dict.items():
            clean_path = path.replace('./', '')
            local_path = os.path.join('src', clean_path.replace('/', os.sep))
            all_files.append((clean_path, local_path))
            
    print(f"Celkem nalezeno {len(all_files)} souborů v manifestu.")
    print("Ověřuji, které soubory chybí v produkčním R2 bucketu (kontrola přes https://suzuki-cello-school.pages.dev)...")
    
    base_url = 'https://suzuki-cello-school.pages.dev/api/media/'
    missing_files = []
    
    for r2_key, local_path in all_files:
        url = base_url + urllib.parse.quote(r2_key)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
            urllib.request.urlopen(req)
        except Exception:
            missing_files.append((r2_key, local_path))
            
    if not missing_files:
        print("\nVšechny soubory jsou v R2 bucketu v pořádku! Žádné nechybí.")
        return
        
    print(f"\nNalezeno {len(missing_files)} chybějících souborů v R2:")
    for r2_key, _ in missing_files:
        print(f" - {r2_key}")
        
    confirm = input("\nChcete tyto chybějící soubory nahrát do R2 pomocí wrangler CLI? (a/n): ")
    if confirm.lower() not in ['a', 'y']:
        print("Ukončeno bez nahrávání.")
        return
        
    # Ověříme, zda je uživatel přihlášený ve wrangleru
    print("\nKontrola přihlášení ve Wrangler...")
    try:
        check_login = subprocess.run(["cmd", "/c", "npx wrangler whoami"], capture_output=True, text=True)
        if "No user logged in" in check_login.stdout or check_login.returncode != 0:
            print("Nejste přihlášen(a) v Cloudflare Wrangler.")
            login_confirm = input("Chcete se nyní přihlásit pomocí 'npx wrangler login'? (a/n): ")
            if login_confirm.lower() in ['a', 'y']:
                subprocess.run(["cmd", "/c", "npx wrangler login"])
            else:
                print("Nelze pokračovat bez přihlášení do Wrangler.")
                return
    except Exception as e:
        print(f"Chyba při kontrole Wrangleru: {e}")
        return

    for r2_key, local_path in missing_files:
        if not os.path.exists(local_path):
            print(f"Varování: Lokální soubor neexistuje na disku: {local_path}")
            continue
            
        print(f"\nNahrávám: {local_path}")
        print(f"Cílový klíč v R2: {r2_key}")
        
        cmd = [
            "npx", "wrangler", "r2", "object", "put",
            f"{bucket}/{r2_key}",
            "--file", local_path
        ]
        
        if os.name == 'nt':
            result = subprocess.run(["cmd", "/c"] + cmd)
        else:
            result = subprocess.run(cmd)
            
        if result.returncode == 0:
            print(f"-> Úspěšně nahráno: {r2_key}")
        else:
            print(f"-> CHYBA při nahrávání: {r2_key}")

if __name__ == '__main__':
    main()
