"""Administrative commands, e.g. `uv run python -m app.cli create-user --help`."""

import argparse
import json
import sys
from pathlib import Path

from sqlalchemy import select

from app.auth.security import hash_password
from app.db import SessionLocal
from app.legal import TERMS_VERSION
from app.models import User
from app.models.project import utcnow
from app.services import account
from app.services.auth import normalize_email


def create_user(
    email: str,
    password: str,
    *,
    verified: bool,
    admin: bool,
    display_name: str | None,
    accept_terms: bool = False,
) -> str:
    with SessionLocal() as db:
        address = normalize_email(email)
        if db.scalar(select(User).where(User.email == address)):
            return f"User {address} already exists."
        user = User(
            email=address,
            password_hash=hash_password(password),
            display_name=display_name,
            email_verified_at=utcnow() if verified else None,
            is_admin=admin,
            # Only for accounts whose owner has already agreed (e.g. test users); everyone else
            # accepts the terms in the app on their first visit.
            terms_accepted_at=utcnow() if accept_terms else None,
            terms_version=TERMS_VERSION if accept_terms else None,
        )
        db.add(user)
        db.commit()
        notes = [note for note, on in (("email verified", verified), ("admin", admin)) if on]
        return f"Created user {address} (id {user.id}){' — ' + ', '.join(notes) if notes else ''}."


def make_admin(email: str) -> str:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == normalize_email(email)))
        if user is None:
            return f"No user {email}."
        user.is_admin = True
        db.commit()
        return f"{user.email} is now an administrator."


def cleanup() -> str:
    with SessionLocal() as db:
        removed = account.cleanup(db)
    return "Removed " + ", ".join(f"{count} {name}" for name, count in removed.items()) + "."


def import_data(email: str, path: str) -> str:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == normalize_email(email)))
        if user is None:
            return f"No user {email}: register and confirm the account first."
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        counts = account.import_data(db, user, data)
    skipped = (
        f", {counts['skipped_answers']} unknown answers skipped"
        if counts["skipped_answers"]
        else ""
    )
    return (
        f"Imported into {user.email}: {counts['projects']} projects, "
        f"{counts['iterations']} iterations, {counts['answers']} answers{skipped}."
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-user", help="Create a user with email and password")
    create.add_argument("--email", required=True)
    create.add_argument("--password", required=True)
    create.add_argument("--name", default=None)
    create.add_argument("--verified", action="store_true", help="Mark the email as confirmed")
    create.add_argument("--admin", action="store_true", help="Make the user an administrator")
    create.add_argument(
        "--accept-terms", action="store_true", help="Record that the user accepted the terms"
    )
    promote = commands.add_parser("make-admin", help="Make an existing user an administrator")
    promote.add_argument("--email", required=True)
    importing = commands.add_parser(
        "import-data", help='Add the projects of a "Scarica i miei dati" file to an account'
    )
    importing.add_argument("--email", required=True, help="The account that receives them")
    importing.add_argument("--file", required=True, help="The exported JSON file")
    commands.add_parser(
        "cleanup", help="Delete expired sessions, spent email links and AI logs over a year old"
    )
    args = parser.parse_args(argv)

    if args.command == "import-data":
        print(import_data(args.email, args.file))
        return 0
    if args.command == "cleanup":
        print(cleanup())
        return 0
    if args.command == "make-admin":
        print(make_admin(args.email))
        return 0
    if len(args.password) < 10:
        parser.error("the password needs at least 10 characters")
    print(
        create_user(
            args.email,
            args.password,
            verified=args.verified,
            admin=args.admin,
            display_name=args.name,
            accept_terms=args.accept_terms,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
