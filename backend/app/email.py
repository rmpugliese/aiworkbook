"""Outgoing email: printed to the log in development, sent over SMTP in production."""

import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger("app.email")


@dataclass(frozen=True)
class Email:
    to: str
    subject: str
    text: str


class EmailDeliveryError(Exception):
    """The mail server could not be reached or refused the message."""


# The "memory" backend appends here; tests read and clear it.
outbox: list[Email] = []


def send_email(to: str, subject: str, text: str) -> None:
    settings = get_settings()
    email = Email(to=to, subject=subject, text=text)
    if settings.email_backend == "memory":
        outbox.append(email)
    elif settings.email_backend == "console":
        logger.warning("Email to %s — %s\n\n%s\n", to, subject, text)
    else:
        message = EmailMessage()
        message["From"] = settings.email_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(text)
        connect = smtplib.SMTP_SSL if settings.smtp_ssl else smtplib.SMTP
        try:
            with connect(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
                if settings.smtp_starttls and not settings.smtp_ssl:
                    smtp.starttls()
                if settings.smtp_username:
                    smtp.login(settings.smtp_username, settings.smtp_password or "")
                smtp.send_message(message)
        except (smtplib.SMTPException, OSError) as error:
            # Logged without the message text: it contains single-use links.
            logger.error("email to %s not sent: %s: %s", to, type(error).__name__, error)
            raise EmailDeliveryError(str(error)) from error


_SIGNATURE = "\n\n—\nAI Project Workbook"


def send_verification(to: str, link: str) -> None:
    send_email(
        to,
        "Conferma il tuo indirizzo email",
        "Ciao,\n\nper attivare il tuo account apri questo link entro 24 ore:\n\n"
        f"{link}\n\nSe non hai chiesto tu la registrazione, ignora questo messaggio." + _SIGNATURE,
    )


def send_already_registered(to: str, login_link: str, reset_link: str) -> None:
    send_email(
        to,
        "Hai già un account",
        "Ciao,\n\nqualcuno (forse tu) ha provato a registrarsi con questo indirizzo, che ha già un "
        f"account.\n\nPer accedere: {login_link}\nSe hai dimenticato la password: {reset_link}"
        "\n\nSe non sei stato tu, puoi ignorare questo messaggio." + _SIGNATURE,
    )


def send_password_reset(to: str, link: str) -> None:
    send_email(
        to,
        "Reimposta la password",
        "Ciao,\n\nper scegliere una nuova password apri questo link entro un'ora:\n\n"
        f"{link}\n\nSe non l'hai chiesto tu, ignora questo messaggio: la password attuale resta "
        "valida." + _SIGNATURE,
    )


def send_project_shared(to: str, inviter: str, project_name: str, link: str) -> None:
    send_email(
        to,
        f"{inviter} ti ha aggiunto a un progetto",
        f"Ciao,\n\n{inviter} ti ha aggiunto come collaboratore al progetto «{project_name}». "
        f"Lo trovi tra i tuoi progetti:\n\n{link}" + _SIGNATURE,
    )


def send_project_invitation(to: str, inviter: str, project_name: str, register_link: str) -> None:
    send_email(
        to,
        f"{inviter} ti invita a collaborare a un progetto",
        f"Ciao,\n\n{inviter} ti invita a collaborare al progetto «{project_name}» su AI Project "
        "Workbook, l'app per documentare i progetti di intelligenza artificiale.\n\n"
        f"Per partecipare iscriviti con questo indirizzo email:\n\n{register_link}\n\n"
        "Il progetto comparirà tra i tuoi appena confermi l'indirizzo. Se non conosci chi ti "
        "ha invitato, ignora questo messaggio." + _SIGNATURE,
    )
