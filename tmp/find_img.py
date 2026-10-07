import urllib.parse
final_url = "https://www.google.com/imgres?imgurl=https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id%3D100063815389228&tbnid=s-lOQSWdzSMUFM&vet=1&imgrefurl=https://www.facebook.com/ContaiNandanikClub/photos/&docid=U52kW4DpWE4uYM&w=1072&h=1067&source=sh/x/im/m5/2&kgs=bf1a84c633ea4f45&shem=epsd1,nisbtsa2,nisbtsal,rimspwouoe&utm_source=epsd1,nisbtsa2,nisbtsal,rimspwouoe,sh/x/im/m5/2"
parsed = urllib.parse.urlparse(final_url)
qs = urllib.parse.parse_qs(parsed.query)
print("Query params:")
for k, v in qs.items():
    print(k, "->", v)
