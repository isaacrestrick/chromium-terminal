#!/usr/bin/env python3
"""Generate extension icons for Chromium Terminal"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_terminal_icon(size):
    """Create a terminal-style icon with a sci-fi aesthetic"""
    # Create image with dark background
    img = Image.new('RGBA', (size, size), (30, 30, 46, 255))
    draw = ImageDraw.Draw(img)
    
    # Colors (Ghostty-inspired)
    bg_secondary = (24, 24, 37, 255)
    accent_primary = (137, 180, 250, 255)
    prompt_color = (137, 220, 235, 255)
    
    # Draw terminal window border
    border_width = max(2, size // 32)
    draw.rectangle(
        [border_width, border_width, size - border_width, size - border_width],
        fill=bg_secondary,
        outline=accent_primary,
        width=border_width
    )
    
    # Draw terminal header bar
    header_height = max(size // 5, border_width * 3)
    draw.rectangle(
        [border_width * 2, border_width * 2, size - border_width * 2, header_height],
        fill=accent_primary
    )
    
    # Draw prompt symbol in the center
    prompt_size = size // 2
    font_size = int(prompt_size * 1.2)
    
    try:
        # Try to use a system monospace font
        font = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    # Draw prompt character
    prompt_char = "❯"
    
    # Calculate text position (centered)
    bbox = draw.textbbox((0, 0), prompt_char, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 + header_height // 2
    
    draw.text((x, y), prompt_char, fill=prompt_color, font=font)
    
    return img

def main():
    """Generate icons in required sizes"""
    sizes = [16, 48, 128]
    icon_dir = 'icons'
    
    # Ensure icons directory exists
    os.makedirs(icon_dir, exist_ok=True)
    
    for size in sizes:
        icon = create_terminal_icon(size)
        filename = os.path.join(icon_dir, f'icon{size}.png')
        icon.save(filename, 'PNG')
        print(f"✓ Generated {filename}")

if __name__ == '__main__':
    main()

