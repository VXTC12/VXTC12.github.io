from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources" / "app-icon-source.png"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_ASSETS = ROOT / "ios" / "App" / "App" / "Assets.xcassets"
PUBLIC_IMAGES = ROOT / "public" / "images"

CREAM = "#FFF7EC"
COFFEE = "#503A31"
ROSE = "#BF6876"


def fitted_source(size: tuple[int, int]) -> Image.Image:
    source = Image.open(SOURCE).convert("RGB")
    return ImageOps.fit(source, size, Image.Resampling.LANCZOS)


def centered_text(draw: ImageDraw.ImageDraw, text: str, y: int, font: ImageFont.FreeTypeFont, fill: str, width: int) -> None:
    box = draw.textbbox((0, 0), text, font=font)
    text_width = box[2] - box[0]
    draw.text(((width - text_width) / 2, y), text, font=font, fill=fill)


def make_splash(size: tuple[int, int]) -> Image.Image:
    width, height = size
    canvas = Image.new("RGB", size, CREAM)
    portrait = height >= width
    logo_size = int(min(width, height) * (0.44 if portrait else 0.34))
    logo = fitted_source((logo_size, logo_size))
    logo_top = int(height * (0.24 if portrait else 0.17))
    canvas.paste(logo, ((width - logo_size) // 2, logo_top))

    draw = ImageDraw.Draw(canvas)
    title_size = max(20, int(min(width, height) * 0.074))
    subtitle_size = max(10, int(min(width, height) * 0.026))
    title_font = ImageFont.truetype(r"C:\Windows\Fonts\simkai.ttf", title_size)
    subtitle_font = ImageFont.truetype(r"C:\Windows\Fonts\simhei.ttf", subtitle_size)
    title_y = logo_top + logo_size + int(min(width, height) * 0.045)
    centered_text(draw, "YG嘻嘻站", title_y, title_font, COFFEE, width)
    centered_text(draw, "OUR LITTLE WORLD", title_y + int(title_size * 1.45), subtitle_font, ROSE, width)
    return canvas


def generate_android_icons() -> None:
    icon_sizes = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    for density, size in icon_sizes.items():
        folder = ANDROID_RES / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        icon = fitted_source((size, size))
        icon.save(folder / "ic_launcher.png", optimize=True)

        round_icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
        round_icon.paste(icon.convert("RGBA"), (0, 0), mask)
        round_icon.save(folder / "ic_launcher_round.png", optimize=True)

        foreground_size = int(size * 2.25)
        fitted_source((foreground_size, foreground_size)).save(
            folder / "ic_launcher_foreground.png", optimize=True
        )


def generate_splashes() -> None:
    android_splashes = {
        "drawable/splash.png": (480, 320),
        "drawable-land-mdpi/splash.png": (480, 320),
        "drawable-land-hdpi/splash.png": (800, 480),
        "drawable-land-xhdpi/splash.png": (1280, 720),
        "drawable-land-xxhdpi/splash.png": (1600, 960),
        "drawable-land-xxxhdpi/splash.png": (1920, 1280),
        "drawable-port-mdpi/splash.png": (320, 480),
        "drawable-port-hdpi/splash.png": (480, 800),
        "drawable-port-xhdpi/splash.png": (720, 1280),
        "drawable-port-xxhdpi/splash.png": (960, 1600),
        "drawable-port-xxxhdpi/splash.png": (1280, 1920),
    }
    for relative_path, size in android_splashes.items():
        destination = ANDROID_RES / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        make_splash(size).save(destination, optimize=True)

    ios_splash = make_splash((2732, 2732))
    ios_splash_folder = IOS_ASSETS / "Splash.imageset"
    for filename in (
        "splash-2732x2732.png",
        "splash-2732x2732-1.png",
        "splash-2732x2732-2.png",
    ):
        ios_splash.save(ios_splash_folder / filename, optimize=True)

    make_splash((1080, 1920)).save(ROOT / "resources" / "splash-preview.png", optimize=True)


def generate_ios_icon() -> None:
    fitted_source((1024, 1024)).save(
        IOS_ASSETS / "AppIcon.appiconset" / "AppIcon-512@2x.png", optimize=True
    )


def generate_pwa_icons() -> None:
    PUBLIC_IMAGES.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        fitted_source((size, size)).save(PUBLIC_IMAGES / f"pwa-icon-{size}.png", optimize=True)


if __name__ == "__main__":
    generate_android_icons()
    generate_ios_icon()
    generate_splashes()
    generate_pwa_icons()
    print("Generated Android and iOS app icons and splash screens.")
