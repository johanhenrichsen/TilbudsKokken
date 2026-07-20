import re

with open('src/App.css', 'r', encoding='utf-8') as f:
    css = f.read()

# --- Fonts ---
css = css.replace("'Barlow Condensed', 'Arial Narrow', Arial, sans-serif", "'Lora', Georgia, 'Times New Roman', serif")
css = css.replace("'Barlow Condensed'", "'Lora'")
css = css.replace("'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
css = css.replace("'Jost'", "'Archivo'")
css = css.replace('Barlow Condensed', 'Lora')

# --- rgba: yellow accent -> Sennep ---
css = css.replace('rgba(245,212,0,', 'rgba(206,159,62,')
css = css.replace('rgba(74,184,74,', 'rgba(124,143,90,')

# --- Hardcoded yellow hex ---
css = css.replace('#f5d400', '#CE9F3E')
css = css.replace('#ffdf00', '#CE9F3E')

# --- Very dark green backgrounds -> Rugbrod ---
for v in ['#0b120b','#0d1f0d','#0c1a0c','#141f0e','#0a1208','#0a1008','#070f07','#060a05','#0d1a0c','#131d10']:
    css = css.replace(v, '#1B1613')

# --- Medium dark green surfaces -> Tinplate ---
for v in ['#111a10','#162415','#0f190f','#0f1c0f','#121e12']:
    css = css.replace(v, '#2B2620')

# --- Darker green surfaces -> Tinplate-hi ---
for v in ['#1a2e1a','#1d321d','#1e341e','#192819','#1d301d','#1a2a1a','#1a3020']:
    css = css.replace(v, '#352F2B')

# --- Light parchment backgrounds -> Rugbrod ---
for v in ['#ede5cc','#f0e8cc','#f4f2ee','#f0eeea','#f4f0e8','#f8f4ec']:
    css = css.replace(v, '#1B1613')
css = css.replace('#f7f4ee', '#2B2620')

# --- Primary green action colors -> Prisrod ---
for v in ['#1a4028','#1a3820','#2a4f30','#1f3a1f','#1f3819']:
    css = css.replace(v, '#C1442E')
for v in ['#2a5c3c','#3a6040','#2a5030','#3a5a40','#2a5040']:
    css = css.replace(v, '#A03428')

# #4a7050 main mid-green -> Prisrod
css = css.replace('#4a7050', '#C1442E')

# rgba green primary -> Prisrod tint
css = css.replace('rgba(74,112,80,', 'rgba(193,68,46,')
css = css.replace('rgba(74,180,74,', 'rgba(124,143,90,')

# --- Deal/available green -> Dild ---
for v in ['#7ab87a','#5aaa5a','#4aaa3a','#6aaa4a','#3d7040','#4a8a5a','#4a9a3a']:
    css = css.replace(v, '#7C8F5A')

# Medium greens -> Sennep
for v in ['#7a9e7a','#6a9a6a','#6a9470','#5a9a5a']:
    css = css.replace(v, '#CE9F3E')

# Muted greens -> muted Papir
for v in ['#6a8a6a','#5a7a5a','#4a6a4a','#3d5a3d','#3d6040','#3a5a3a']:
    css = css.replace(v, 'rgba(238,230,216,0.45)')

# --- Light green tints -> Dild-dim ---
for v in ['#eef5ee','#f5faf5','#f5faf4','#f0f7f0','#f0f7f2']:
    css = css.replace(v, 'rgba(124,143,90,0.12)')
for v in ['#e8f0e8','#ddf0dd','#d4e8d4','#c8e8c8']:
    css = css.replace(v, 'rgba(124,143,90,0.18)')
css = css.replace('#d4ead4', 'rgba(124,143,90,0.22)')

# --- Green borders -> Sennep tint ---
css = css.replace('#c8d9c8', 'rgba(206,159,62,0.3)')
css = css.replace('#b4c8b4', 'rgba(206,159,62,0.3)')
css = css.replace('#c4ddc4', 'rgba(206,159,62,0.3)')
css = css.replace('#a8c8a8', 'rgba(206,159,62,0.3)')
css = css.replace('#c0d8c0', 'rgba(206,159,62,0.3)')
css = css.replace('#8ab88a', 'rgba(206,159,62,0.4)')

# --- Dark mode green borders -> muted border ---
for v in ['#2a4a2a','#2a3d2a','#1e3618','#1e3820','#1e2e1e','#243024','#1e301e','#263e26','#2e4a2e','#3a5a3a','#233523']:
    css = css.replace(v, 'rgba(238,230,216,0.1)')
css = css.replace('#1f3819', 'rgba(238,230,216,0.08)')
css = css.replace('#2a4028', 'rgba(238,230,216,0.08)')

# --- White / light card surfaces -> Tinplate ---
css = re.sub(r'background:\s*white;', 'background: #2B2620;', css)
css = re.sub(r'background:\s*#ffffff;', 'background: #2B2620;', css)
css = re.sub(r'background:\s*#fafafa;', 'background: #2B2620;', css)
css = re.sub(r'background:\s*#f8fbf8;', 'background: #2B2620;', css)
css = re.sub(r'background:\s*#f4f7f4;', 'background: #2B2620;', css)
css = re.sub(r'background-color:\s*white;', 'background-color: #2B2620;', css)
css = re.sub(r'background-color:\s*#ffffff;', 'background-color: #2B2620;', css)

# --- Primary text -> Papir ---
css = re.sub(r'color:\s*#1a1a1a;', 'color: #EEE6D8;', css)
css = re.sub(r'color:\s*#2d2d2d;', 'color: #EEE6D8;', css)
css = re.sub(r'color:\s*white;', 'color: #EEE6D8;', css)
css = css.replace('#1a1a1a', '#EEE6D8')

css = re.sub(r'color:\s*#333333;', 'color: rgba(238,230,216,0.8);', css)
css = re.sub(r'color:\s*#444444;', 'color: rgba(238,230,216,0.65);', css)
css = re.sub(r'color:\s*#4a4a4a;', 'color: rgba(238,230,216,0.65);', css)
css = re.sub(r'color:\s*#555555;', 'color: rgba(238,230,216,0.55);', css)
css = re.sub(r'color:\s*#5a5a5a;', 'color: rgba(238,230,216,0.55);', css)
css = re.sub(r'color:\s*#666666;', 'color: rgba(238,230,216,0.45);', css)
css = re.sub(r'color:\s*#777777;', 'color: rgba(238,230,216,0.38);', css)
css = re.sub(r'color:\s*#888888;', 'color: rgba(238,230,216,0.32);', css)
css = re.sub(r'color:\s*#999999;', 'color: rgba(238,230,216,0.28);', css)
css = re.sub(r'color:\s*#aaaaaa;', 'color: rgba(238,230,216,0.25);', css)
css = re.sub(r'color:\s*#9ca3af;', 'color: rgba(238,230,216,0.28);', css)
css = re.sub(r'color:\s*#c8c8c8;', 'color: rgba(238,230,216,0.2);', css)

# --- Misc light values ---
css = css.replace('#f5f5f5', '#352F2B')
css = css.replace('#f0f0f0', 'rgba(238,230,216,0.06)')
css = css.replace('#f3f3f3', 'rgba(238,230,216,0.06)')
css = css.replace('#f3f4f6', 'rgba(238,230,216,0.06)')
css = css.replace('#f5f0e6', '#352F2B')
css = css.replace('#fafafa', '#2B2620')

# --- Error/danger red stays (but update where it was green) ---
# Keep existing .error-box, .difficulty-avanceret colors untouched

print('Done. Lines:', css.count('\n'))

with open('src/App.css', 'w', encoding='utf-8') as f:
    f.write(css)
