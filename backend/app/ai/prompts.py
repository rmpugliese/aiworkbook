"""What the assistant is told. Everything is in Italian, like the workbook."""

from dataclasses import dataclass
from typing import Literal

from app.ai.provider import Message
from app.models import Answer, Iteration, Project
from app.workbook.schema import (
    GoNoGoQuestion,
    MultiChoiceQuestion,
    PhaseGateQuestion,
    Question,
    Template,
)

Action = Literal["suggest", "improve", "review"]

CONTEXT_LIMIT = 12_000  # characters of other answers sent along
VERDICT = {"go": "GO", "maybe": "MAYBE", "no_go": "NO-GO"}
ROMAN = ("I", "II", "III", "IV", "V", "VI")

SYSTEM = """Sei un assistente esperto della metodologia CPMAI per la gestione dei progetti di \
intelligenza artificiale. Aiuti un consulente a compilare il workbook di un progetto per un suo \
cliente.

Regole:
- Scrivi sempre in italiano, in modo chiaro, concreto e professionale.
- Basati solo sulle informazioni fornite. Non inventare fatti, numeri o nomi sul cliente: quando \
fai un'ipotesi o servirebbe un dato che non hai, segnalalo con "[da verificare]".
- Rispondi con il solo testo richiesto, senza preamboli ("Ecco…") e senza titoli. Il campo \
accetta Markdown semplice: usa elenchi puntati o numerati quando aiutano, una tabella Markdown \
solo per dati davvero tabellari (es. KPI, rischi, stakeholder) con al massimo 4 colonne, il \
grassetto con misura. Niente HTML, blocchi di codice o titoli con "#".
- Il consulente può aggiungere indicazioni per la singola richiesta: seguile per tono, \
contenuto, lunghezza e focus, ma le regole precedenti restano sempre valide."""

INSTRUCTIONS: dict[Action, str] = {
    "suggest": (
        "Scrivi una proposta di risposta per questa domanda, adatta al progetto e "
        "all'iterazione. Se il testo attuale non è vuoto, tienine conto e integralo. "
        "Restituisci solo il testo della risposta."
    ),
    "improve": (
        "Migliora il testo attuale: rendilo più chiaro, completo e professionale, "
        "correggi errori e ripetizioni. Mantieni il significato e le informazioni: non "
        "aggiungere fatti nuovi. Restituisci solo il testo migliorato."
    ),
    "review": (
        "Non riscrivere il testo. Fai una revisione critica come un esperto CPMAI: elenca "
        "in punti brevi le lacune, le incoerenze con le altre risposte del progetto e le "
        "domande da porre al cliente o al team per completare la risposta."
    ),
}


@dataclass(frozen=True)
class Located:
    question: Question
    phase_number: int
    phase_title: str
    group_title: str
    task_title: str
    guidance: str


def locate(template: Template, key: str) -> Located | None:
    for phase in template.phases:
        for group in phase.task_groups:
            for task in group.tasks:
                for question in task.questions:
                    if question.key == key:
                        return Located(
                            question,
                            phase.number,
                            phase.title,
                            group.title,
                            task.title,
                            task.guidance,
                        )
    return None


def _answer_text(question: Question, answer: Answer) -> str:
    parts: list[str] = []
    if answer.verdict:
        parts.append(f"Verdetto: {VERDICT.get(answer.verdict, answer.verdict)}")
    if isinstance(question, MultiChoiceQuestion) and answer.choices:
        labels = [o.label for o in question.options if o.key in answer.choices]
        parts.append("Scelte: " + ", ".join(labels))
    if isinstance(question, PhaseGateQuestion) and answer.choices:
        labels = [c.label for c in question.criteria if c.key in answer.choices]
        parts.append("Criteri soddisfatti: " + "; ".join(labels))
    if answer.text and answer.text.strip():
        parts.append(answer.text.strip())
    return "\n".join(parts)


def _other_answers(template: Template, answers: list[Answer], here: Located) -> tuple[str, bool]:
    """Other answers of the iteration, the current phase first; truncated past the limit."""
    by_key = {answer.question_key: answer for answer in answers}
    entries: list[tuple[int, str]] = []
    for phase in template.phases:
        for group in phase.task_groups:
            for task in group.tasks:
                for question in task.questions:
                    answer = by_key.get(question.key)
                    if answer is None or question.key == here.question.key:
                        continue
                    text = _answer_text(question, answer)
                    if not text:
                        continue
                    priority = 0 if phase.number == here.phase_number else 1
                    entries.append(
                        (
                            priority,
                            f"[Fase {ROMAN[phase.number - 1]} · {task.title}] "
                            f"{question.prompt}\n{text}",
                        )
                    )
    entries.sort(key=lambda entry: entry[0])  # stable: workbook order within each group
    chosen: list[str] = []
    used = 0
    truncated = False
    for _, entry in entries:
        if used + len(entry) > CONTEXT_LIMIT:
            truncated = True
            break
        chosen.append(entry)
        used += len(entry)
    return "\n\n".join(chosen), truncated


def build_messages(
    *,
    action: Action,
    project: Project,
    iteration: Iteration,
    template: Template,
    answers: list[Answer],
    here: Located,
    current_text: str,
    current_verdict: str | None,
    instructions: str = "",
) -> list[Message]:
    question = here.question
    lines = [
        f"PROGETTO: {project.name}",
        f"Cliente: {project.client_name or 'non indicato'}",
    ]
    if project.description:
        lines.append(f"Descrizione: {project.description}")
    lines += [
        f"ITERAZIONE {iteration.number}: {iteration.title}",
        f"User story: {iteration.user_story or 'non indicata'}",
        "",
        f"FASE {ROMAN[here.phase_number - 1]} · {here.phase_title} — {here.group_title} — "
        f"{here.task_title}",
        f"Guida del task: {here.guidance}",
        "",
        f"DOMANDA: {question.prompt}",
        f"Cosa considerare: {question.help}",
    ]
    if isinstance(question, GoNoGoQuestion | PhaseGateQuestion):
        chosen = VERDICT.get(current_verdict or "", "non ancora scelto")
        lines.append(f"Verdetto scelto: {chosen}")
    if isinstance(question, PhaseGateQuestion) and question.criteria:
        lines.append("Criteri di passaggio: " + "; ".join(c.label for c in question.criteria))
    others, truncated = _other_answers(template, answers, here)
    lines += [
        "",
        "ALTRE RISPOSTE GIÀ DATE NELL'ITERAZIONE:",
        others or "nessuna",
    ]
    if truncated:
        lines.append("(elenco troncato per lunghezza)")
    lines += [
        "",
        "TESTO ATTUALE DEL CAMPO:",
        current_text.strip() or "(vuoto)",
        "",
        f"COMPITO: {INSTRUCTIONS[action]}",
    ]
    if instructions.strip():
        lines += [
            "",
            "INDICAZIONI DEL CONSULENTE PER QUESTA RICHIESTA:",
            '"""',
            instructions.strip(),
            '"""',
        ]
    return [{"role": "system", "content": SYSTEM}, {"role": "user", "content": "\n".join(lines)}]
