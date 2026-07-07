import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://en.wikipedia.org/w/api.php?action=query&titles=File:Metronome.ogg&prop=imageinfo&iiprop=url&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        pages = data['query']['pages']
        for page_id in pages:
            file_url = pages[page_id]['imageinfo'][0]['url']
            print("Found URL:", file_url)
            # Create request for downloading the actual file
            file_req = urllib.request.Request(file_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(file_req, context=ctx) as file_resp, open('public/metronome.ogg', 'wb') as out_file:
                out_file.write(file_resp.read())
            print("Downloaded to public/metronome.ogg!")
except Exception as e:
    print("Error:", e)
