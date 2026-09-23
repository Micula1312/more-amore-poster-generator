from pathlib import Path
from urllib.request import urlopen
from fontTools.ttLib import TTFont
from io import BytesIO

URL = "https://gitlab.com/velvetyne/interlope/-/raw/main/font/ttf/Interlope-Regular.ttf"
OUT = Path("public/fonts/MoreAmoreSwash.ttf")
LICENSE_OUT = Path("public/fonts/OFL-Interlope.txt")
OUT.parent.mkdir(parents=True, exist_ok=True)

raw = urlopen(URL, timeout=30).read()
LICENSE_OUT.write_bytes(urlopen("https://gitlab.com/velvetyne/interlope/-/raw/main/LICENSE.txt", timeout=30).read())
font = TTFont(BytesIO(raw))
subs = {}
for record in font["GSUB"].table.FeatureList.FeatureRecord:
    if record.FeatureTag != "ss02":
        continue
    for lookup_index in record.Feature.LookupListIndex:
        lookup = font["GSUB"].table.LookupList.Lookup[lookup_index]
        for subtable in lookup.SubTable:
            if hasattr(subtable, "mapping"):
                subs.update(subtable.mapping)

for table in font["cmap"].tables:
    if not table.isUnicode():
        continue
    for codepoint, glyph_name in list(table.cmap.items()):
        if glyph_name in subs:
            table.cmap[codepoint] = subs[glyph_name]

for record in font["name"].names:
    if record.nameID in (1, 4, 6):
        replacement = {1:"More Amore Swash",4:"More Amore Swash Regular",6:"MoreAmoreSwash-Regular"}[record.nameID]
        record.string = replacement.encode("utf-16-be") if record.platformID in (0,3) else replacement.encode("latin-1","replace")
font.save(OUT)
print(f"Built {OUT} with Interlope ss02 swash alternates ({len(subs)} substitutions).")
