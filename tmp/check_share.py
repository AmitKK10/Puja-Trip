import urllib.request, urllib.parse, re, json

share_url = "https://share.google/pgy9U5Ln7eaQmq0wg"
opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler)
req = urllib.request.Request(share_url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
res = opener.open(req)
final_url = res.geturl()
print("Final redirect URL:", final_url)
content = res.read().decode("utf-8", errors="ignore")

with open("/tmp/google_imgres.html", "w") as f:
    f.write(content)

print("Saved HTML, length:", len(content))

# Look for image URLs in the html
img_srcs = re.findall(r'src=["\'](https?://[^"\']+)["\']', content)
print("Image srcs found:", len(img_srcs))
for s in img_srcs[:15]:
    print("  ", s)

# Look for encrypted-tbn URLs
tbns = re.findall(r'https://encrypted-tbn[0-9]\.gstatic\.com/images\?q=tbn:[^\s"\'\\&]+', content)
print("Encrypted-tbn URLs found:", len(tbns))
for t in set(tbns):
    print("  tbn:", t)
