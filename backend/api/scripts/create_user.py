#!/usr/bin/env python3
"""Create or update an application user in public.users."""

import argparse
import os
import sys
from getpass import getpass

import bcrypt
import psycopg
from dotenv import load_dotenv


VALID_ROLES = {"admin", "monitor", "operativo"}


def build_conninfo() -> str:
    load_dotenv()
    return (
        f"host={os.getenv('DB_HOST', 'localhost')} "
        f"port={os.getenv('DB_PORT', 5432)} "
        f"dbname={os.getenv('DB_NAME')} "
        f"user={os.getenv('DB_USER')} "
        f"password={os.getenv('DB_PASSWORD')}"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or update a Panel Incidentes user."
    )
    parser.add_argument("--username", required=True, help="Login username.")
    parser.add_argument(
        "--email",
        help="User email. Defaults to <username>@panel.local for local bootstrap.",
    )
    parser.add_argument("--password", help="Password. If omitted, prompts securely.")
    parser.add_argument(
        "--role",
        default="operativo",
        choices=sorted(VALID_ROLES),
        help="Application role.",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update password, email, role and active status if the user exists.",
    )
    parser.add_argument(
        "--inactive",
        action="store_true",
        help="Create or update the user as inactive.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    password = args.password or getpass("Password: ")
    if not password:
        print("Password cannot be empty.", file=sys.stderr)
        return 2

    email = args.email or f"{args.username}@panel.local"
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    is_active = not args.inactive

    insert_sql = """
        INSERT INTO public.users (username, email, password_hash, role, is_active)
        VALUES (%(username)s, %(email)s, %(password_hash)s, %(role)s, %(is_active)s)
        RETURNING id, username, email, role, is_active
    """
    update_sql = """
        INSERT INTO public.users (username, email, password_hash, role, is_active)
        VALUES (%(username)s, %(email)s, %(password_hash)s, %(role)s, %(is_active)s)
        ON CONFLICT (username) DO UPDATE SET
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active
        RETURNING id, username, email, role, is_active
    """

    params = {
        "username": args.username,
        "email": email,
        "password_hash": password_hash,
        "role": args.role,
        "is_active": is_active,
    }

    try:
        with psycopg.connect(build_conninfo()) as conn:
            with conn.cursor() as cur:
                cur.execute(update_sql if args.update else insert_sql, params)
                row = cur.fetchone()
            conn.commit()
    except psycopg.errors.UniqueViolation as exc:
        print(
            "User or email already exists. Use --update to replace an existing username.",
            file=sys.stderr,
        )
        print(f"Database detail: {exc.diag.message_detail or exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Could not create user: {exc}", file=sys.stderr)
        return 1

    user_id, username, user_email, role, active = row
    print(
        f"User ready: id={user_id} username={username} "
        f"email={user_email} role={role} active={active}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
