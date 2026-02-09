# TASK: Update Dhairya Landing Page Copy

## Location
- App: https://dhairya-umber.vercel.app/index.html
- Update the left-side / main hero copy on the landing page
- Replace existing Kannada text block with the new copy below

## New Copy (exact text)

```
ಮದುವೆಗೆ ಸಾವಿರ ಜನ ಕರೆಯುತ್ತೀರಿ. ನಾಮಕರಣಕ್ಕೆ ಐನೂರು. ಹಬ್ಬಕ್ಕೆ ಇಡೀ ಬೀದಿ.

ಆದರೆ ಕ್ಯಾನ್ಸರ್ ಬಂದ್ರೆ? ಒಬ್ಬರೇ ಅನುಭವಿಸುತ್ತೀವಿ.

ಯಾಕೆ?

ನಿಮ್ಮ ಈ ಕ್ಯಾನ್ಸರ್ ಜೊತೆಗಿನ ಹೋರಾಟದಲ್ಲಿ — ನಿಮ್ಮ ಮನೆಯವರು, ಸ್ನೇಹಿತರು, ಸಂಬಂಧಿಗಳು, ಹಿತೈಷಿಗಳು ಎಲ್ಲರೂ ಬೇಕು. ಅವರ ಪ್ರತಿ ಪ್ರಾರ್ಥನೆ, ದೊಡ್ಡವರ ಆಶೀರ್ವಾದ, ನೀವು ನಂಬೋ ಆ ಭಗವಂತನ ಕೃಪೆ — ಎಲ್ಲವೂ ಬೇಕು.

ಇವೆಲ್ಲದರ ಜೊತೆಗೆ — ನಿಮ್ಮ ಹಾಗೆ ಕ್ಯಾನ್ಸರ್ ಜೊತೆ ಹೋರಾಡ್ತಿರೋರು, ಅದನ್ನ ಗೆದ್ದಿದ್ರೋರ ಕಥೆಗಳು ನಿಮಗೆ ಬೇಕಿರೋ ಧೈರ್ಯ ಸಿಗಲಿ ಅನ್ನೋ ಒಂದು ಚಿಕ್ಕ ಪ್ರಯತ್ನ ಈ ಧೈರ್ಯ ವೇದಿಕೆ.

ಬನ್ನಿ. ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ. ಬೇರೆಯವರ ಕಥೆ ಕೇಳಿ.

ನಿಮ್ಮ ಧೈರ್ಯ ನೋಡಿ ಕ್ಯಾನ್ಸರ್ ಕೂಡ ನಿಮ್ಮನ್ನ ಬಿಟ್ಟು ಓಡಿ ಹೋಗ್ಲಿ...
```

## Formatting Rules

### Font Sizes (use responsive units)
- Line 1 (ಮದುವೆಗೆ ಸಾವಿರ...ಇಡೀ ಬೀದಿ.) → Regular body size (1.1rem)
- Line 2 (ಆದರೆ ಕ್ಯಾನ್ಸರ್ ಬಂದ್ರೆ? ಒಬ್ಬರೇ ಅನುಭವಿಸುತ್ತೀವಿ.) → Slightly larger (1.3rem), bold
- Line 3 (ಯಾಕೆ?) → Large, standalone, bold (1.8rem)
- Middle paragraphs → Regular body (1.1rem)
- Line "ಬನ್ನಿ. ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ. ಬೇರೆಯವರ ಕಥೆ ಕೇಳಿ." → Medium-bold (1.2rem), bold
- Last line (ನಿಮ್ಮ ಧೈರ್ಯ ನೋಡಿ...) → Italic, slightly larger (1.2rem)

### Words/Phrases to Highlight (use accent color or bold+color)
Use the app's existing warm/turmeric accent color for highlights.

| Word/Phrase | Treatment |
|---|---|
| ಸಾವಿರ ಜನ | bold |
| ಐನೂರು | bold |
| ಇಡೀ ಬೀದಿ | bold |
| ಒಬ್ಬರೇ ಅನುಭವಿಸುತ್ತೀವಿ | bold + accent color |
| ಯಾಕೆ? | bold + accent color + large font |
| ಎಲ್ಲರೂ ಬೇಕು | bold |
| ಎಲ್ಲವೂ ಬೇಕು | bold |
| ಧೈರ್ಯ ವೇದಿಕೆ | bold + accent color |
| ಬನ್ನಿ | bold |
| ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ | bold |
| ಬೇರೆಯವರ ಕಥೆ ಕೇಳಿ | bold |
| ಓಡಿ ಹೋಗ್ಲಿ | bold + accent color |

### Spacing
- Clear paragraph breaks between each section (margin-bottom: 1.5rem between blocks)
- "ಯಾಕೆ?" should have extra whitespace above and below (margin: 2rem 0) — it should breathe, feel like a pause
- The last line should have top margin (margin-top: 2rem) — dramatic pause before the closer

### Visual Structure
```
ಮದುವೆಗೆ **ಸಾವಿರ ಜನ** ಕರೆಯುತ್ತೀರಿ. ನಾಮಕರಣಕ್ಕೆ **ಐನೂರು**. ಹಬ್ಬಕ್ಕೆ **ಇಡೀ ಬೀದಿ**.

ಆದರೆ ಕ್ಯಾನ್ಸರ್ ಬಂದ್ರೆ? **ಒಬ್ಬರೇ ಅನುಭವಿಸುತ್ತೀವಿ**.    ← accent color

                **ಯಾಕೆ?**                                  ← big, accent, standalone

ನಿಮ್ಮ ಈ ಕ್ಯಾನ್ಸರ್ ಜೊತೆಗಿನ ಹೋರಾಟದಲ್ಲಿ — ನಿಮ್ಮ ಮನೆಯವರು,
ಸ್ನೇಹಿತರು, ಸಂಬಂಧಿಗಳು, ಹಿತೈಷಿಗಳು **ಎಲ್ಲರೂ ಬೇಕು**.
ಅವರ ಪ್ರತಿ ಪ್ರಾರ್ಥನೆ, ದೊಡ್ಡವರ ಆಶೀರ್ವಾದ, ನೀವು ನಂಬೋ ಆ
ಭಗವಂತನ ಕೃಪೆ — **ಎಲ್ಲವೂ ಬೇಕು**.

ಇವೆಲ್ಲದರ ಜೊತೆಗೆ — ನಿಮ್ಮ ಹಾಗೆ ಕ್ಯಾನ್ಸರ್ ಜೊತೆ ಹೋರಾಡ್ತಿರೋರು,
ಅದನ್ನ ಗೆದ್ದಿದ್ರೋರ ಕಥೆಗಳು ನಿಮಗೆ ಬೇಕಿರೋ ಧೈರ್ಯ ಸಿಗಲಿ ಅನ್ನೋ
ಒಂದು ಚಿಕ್ಕ ಪ್ರಯತ್ನ ಈ **ಧೈರ್ಯ ವೇದಿಕೆ**.

**ಬನ್ನಿ**. **ನಿಮ್ಮ ಕಥೆ ಹೇಳಿ**. **ಬೇರೆಯವರ ಕಥೆ ಕೇಳಿ**.

ನಿಮ್ಮ ಧೈರ್ಯ ನೋಡಿ ಕ್ಯಾನ್ಸರ್ ಕೂಡ ನಿಮ್ಮನ್ನ ಬಿಟ್ಟು **ಓಡಿ ಹೋಗ್ಲಿ**...
```

### Design Notes
- Match existing app's warm color palette (turmeric/saffron tones)
- Text should be left-aligned
- Use Noto Sans Kannada or whatever Kannada font is already in the app
- Line height: 1.8 for readability
- On mobile: reduce font sizes proportionally but keep the hierarchy
- Do NOT center-align the text — left-aligned feels more personal, like someone talking to you
- Keep existing background, header, and navigation — only replace the main copy block
