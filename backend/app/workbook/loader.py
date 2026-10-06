"""Loads workbook templates from the YAML files shipped with the package."""

import re
from functools import cache
from pathlib import Path

import yaml

from app.workbook.schema import Template

TEMPLATES_DIR = Path(__file__).parent / "templates"
_FILE_PATTERN = re.compile(r"^v(\d+)\.yaml$")


class TemplateNotFoundError(LookupError):
    pass


def available_versions() -> list[int]:
    versions = (_FILE_PATTERN.match(path.name) for path in TEMPLATES_DIR.iterdir())
    return sorted(int(match.group(1)) for match in versions if match)


@cache
def load_template(version: int) -> Template:
    path = TEMPLATES_DIR / f"v{version}.yaml"
    if not path.is_file():
        raise TemplateNotFoundError(f"workbook template v{version} does not exist")
    template = Template.model_validate(yaml.safe_load(path.read_text(encoding="utf-8")))
    if template.version != version:
        raise ValueError(f"{path.name} declares version {template.version}")
    return template


def current_template() -> Template:
    return load_template(max(available_versions()))


def validate_all_templates() -> None:
    """Loads every template, raising on the first invalid one."""
    for version in available_versions():
        load_template(version)
