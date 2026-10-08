"""Administrative commands, e.g. `uv run python -m app.cli create-user --help`."""

import argparse
import sys

from sqlalchemy import select

from app.auth.security import hash_password
from app.db import SessionLocal
from app.models import User
from app.models.project import utcnow
from app.services.auth import normalize_email


def create_user(
    email: str, password: str, *, verified: bool, admin: bool, display_name: str | None
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


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-user", help="Create a user with email and password")
    create.add_argument("--email", required=True)
    create.add_argument("--password", required=True)
    create.add_argument("--name", default=None)
    create.add_argument("--verified", action="store_true", help="Mark the email as confirmed")
    create.add_argument("--admin", action="store_true", help="Make the user an administrator")
    promote = commands.add_parser("make-admin", help="Make an existing user an administrator")
    promote.add_argument("--email", required=True)
    args = parser.parse_args(argv)

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
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
