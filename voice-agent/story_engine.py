"""
Story engine for Dhairya — loads Kannada stories from markdown files,
extracts the Kannada script, and serves them by index or randomly.

Supports two categories:
  - survivors: first-person fictional stories (stories/survivors/)
  - celebrities: third-person real inspiration stories (stories/celebrities/)
"""

import os
import re
import random
from dataclasses import dataclass
from config import (
    SURVIVORS_DIR,
    CELEBRITIES_DIR,
    SURVIVORS_AUDIO_DIR,
    CELEBRITIES_AUDIO_DIR,
)


@dataclass
class Story:
    id: str               # e.g. "story_01_meena" or "celeb_01_shivarajkumar"
    number: int           # 1-10 for survivors, 1-5 for celebrities
    category: str         # "survivor" or "celebrity"
    name_kannada: str     # e.g. "ಮೀನಾ ಅಕ್ಕ" or "ಶಿವರಾಜ್‌ಕುಮಾರ್"
    name_english: str     # e.g. "Meena Akka" or "Shiva Rajkumar"
    title_kannada: str    # Full story title in Kannada
    title_english: str    # Full story title in English
    cancer_type: str
    age: int
    location: str
    kannada_text: str     # The full Kannada script for TTS
    audio_path: str       # Path to pre-generated .wav (may not exist yet)


def _extract_between(text: str, start_marker: str, end_marker: str) -> str:
    """Extract text between two markers in a markdown file."""
    start = text.find(start_marker)
    if start == -1:
        return ""
    start += len(start_marker)
    end = text.find(end_marker, start)
    if end == -1:
        return text[start:].strip()
    return text[start:end].strip()


def _extract_context_field(text: str, field: str) -> str:
    """Extract a field like '- **Type:** Breast cancer survivor' from the Context block."""
    pattern = rf"\*\*{field}:\*\*\s*(.+)"
    match = re.search(pattern, text)
    return match.group(1).strip() if match else ""


def _parse_age(age_str: str) -> int:
    """Pull a number from a string like '42'."""
    nums = re.findall(r"\d+", age_str)
    return int(nums[0]) if nums else 0


def load_survivor(filepath: str) -> Story:
    """Parse a survivor story markdown file into a Story object."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    filename = os.path.splitext(os.path.basename(filepath))[0]
    number_match = re.search(r"(\d+)", filename)
    number = int(number_match.group(1)) if number_match else 0

    # Extract titles
    title_kn_match = re.search(r"## Story Title \(Kannada\):\s*(.+)", content)
    title_en_match = re.search(r"## Story Title \(English\):\s*(.+)", content)
    title_kannada = title_kn_match.group(1).strip() if title_kn_match else ""
    title_english = title_en_match.group(1).strip() if title_en_match else ""

    # Extract name from title  e.g. "ಮೀನಾ ಅಕ್ಕನ ಕಥೆ" → "ಮೀನಾ ಅಕ್ಕ"
    name_kannada = title_kannada.split("—")[0].strip().rstrip("ನ ಕಥೆ").strip() if title_kannada else ""
    name_english = title_english.split("—")[0].strip().rstrip("'s Story").strip() if title_english else ""

    # Context fields
    cancer_type = _extract_context_field(content, "Type")
    age = _parse_age(_extract_context_field(content, "Age at diagnosis"))
    location = _extract_context_field(content, "Location")

    # Extract the Kannada script block (between "## Kannada Script" and "---")
    kannada_text = _extract_between(content, "## Kannada Script", "---")

    # Audio path
    audio_path = os.path.join(SURVIVORS_AUDIO_DIR, f"{filename}.wav")

    return Story(
        id=filename,
        number=number,
        category="survivor",
        name_kannada=name_kannada,
        name_english=name_english,
        title_kannada=title_kannada,
        title_english=title_english,
        cancer_type=cancer_type,
        age=age,
        location=location,
        kannada_text=kannada_text,
        audio_path=audio_path,
    )


def load_celebrity(filepath: str) -> Story:
    """Parse a celebrity inspiration story markdown file into a Story object."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    filename = os.path.splitext(os.path.basename(filepath))[0]
    number_match = re.search(r"(\d+)", filename)
    number = int(number_match.group(1)) if number_match else 0

    # Celebrity title format: ## ⭐ ಶಿವರಾಜ್‌ಕುಮಾರ್ — "quote"
    title_kn_match = re.search(r"## ⭐\s*(.+)", content)
    # English title on next line: ## Shiva Rajkumar — "quote"
    lines = content.split("\n")
    title_en = ""
    for i, line in enumerate(lines):
        if line.startswith("## ⭐"):
            # Next non-empty line starting with ## should be the English title
            for j in range(i + 1, min(i + 3, len(lines))):
                if lines[j].startswith("## ") and not lines[j].startswith("## ⭐"):
                    title_en = lines[j].lstrip("# ").strip()
                    break
            break

    title_kannada = title_kn_match.group(1).strip() if title_kn_match else ""
    title_english = title_en

    # Extract name from title: "ಶಿವರಾಜ್‌ಕುಮಾರ್ — quote" → "ಶಿವರಾಜ್‌ಕುಮಾರ್"
    name_kannada = title_kannada.split("—")[0].strip().strip('"') if title_kannada else ""
    name_english = title_english.split("—")[0].strip().strip('"') if title_english else ""

    # Context fields
    cancer_type = _extract_context_field(content, "Type")
    age = _parse_age(_extract_context_field(content, "Age at diagnosis"))
    # Celebrities don't have Location, use Status instead
    location = _extract_context_field(content, "Status") or ""
    # Shorten to first sentence for display
    if ". " in location:
        location = location.split(". ")[0]

    # Extract the Kannada script block (between "## Kannada Script" and "---")
    kannada_text = _extract_between(content, "## Kannada Script", "---")

    # Audio path
    audio_path = os.path.join(CELEBRITIES_AUDIO_DIR, f"{filename}.wav")

    return Story(
        id=filename,
        number=number,
        category="celebrity",
        name_kannada=name_kannada,
        name_english=name_english,
        title_kannada=title_kannada,
        title_english=title_english,
        cancer_type=cancer_type,
        age=age,
        location=location,
        kannada_text=kannada_text,
        audio_path=audio_path,
    )


# Keep backward-compatible alias
load_story = load_survivor


def load_all_survivors() -> list[Story]:
    """Load all story_*.md files from the survivors directory, sorted by number."""
    stories = []
    if not os.path.isdir(SURVIVORS_DIR):
        return stories
    for fname in sorted(os.listdir(SURVIVORS_DIR)):
        if fname.startswith("story_") and fname.endswith(".md"):
            filepath = os.path.join(SURVIVORS_DIR, fname)
            stories.append(load_survivor(filepath))
    return stories


def load_all_celebrities() -> list[Story]:
    """Load all celeb_*.md files from the celebrities directory, sorted by number."""
    stories = []
    if not os.path.isdir(CELEBRITIES_DIR):
        return stories
    for fname in sorted(os.listdir(CELEBRITIES_DIR)):
        if fname.startswith("celeb_") and fname.endswith(".md"):
            filepath = os.path.join(CELEBRITIES_DIR, fname)
            stories.append(load_celebrity(filepath))
    return stories


def load_all_stories() -> list[Story]:
    """Load all stories (both survivors and celebrities), sorted by category then number."""
    return load_all_survivors() + load_all_celebrities()


def get_story_by_number(stories: list[Story], number: int, category: str | None = None) -> Story | None:
    """Get a story by its number, optionally filtered by category."""
    for s in stories:
        if s.number == number:
            if category is None or s.category == category:
                return s
    return None


def get_random_story(stories: list[Story], exclude_ids: list[str] | None = None) -> Story:
    """Pick a random story, optionally excluding ones already heard."""
    pool = stories
    if exclude_ids:
        pool = [s for s in stories if s.id not in exclude_ids]
    if not pool:
        pool = stories  # fallback: replay if all heard
    return random.choice(pool)


def has_audio(story: Story) -> bool:
    """Check if the pre-generated audio file exists."""
    return os.path.isfile(story.audio_path)


# --- Module-level convenience ---
_survivors_cache: list[Story] | None = None
_celebrities_cache: list[Story] | None = None
_all_cache: list[Story] | None = None


def get_stories(category: str | None = None) -> list[Story]:
    """Return cached list of stories. Filter by category if specified."""
    global _survivors_cache, _celebrities_cache, _all_cache

    if category == "survivor":
        if _survivors_cache is None:
            _survivors_cache = load_all_survivors()
        return _survivors_cache
    elif category == "celebrity":
        if _celebrities_cache is None:
            _celebrities_cache = load_all_celebrities()
        return _celebrities_cache
    else:
        if _all_cache is None:
            _all_cache = load_all_stories()
        return _all_cache
