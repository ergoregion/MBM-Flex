import re

ERROR_EXPLANATIONS = {
    "identifierstart": "Invalid start of identifier: object keys must begin with a quote `\"`.",
    "key": "Expected an object key: keys must be enclosed in double quotes.",
    "string": "Expected a string value enclosed in double quotes.",
    "value": "Expected a JSON value (string, number, object, array, true, false, null).",
    "colon": "Missing colon `:` after an object key.",
    "comma": "Missing comma `,` between elements in an object or array.",
    "u+007d": "Missing closing brace `}` for an object.",
    "u+005d": "Missing closing bracket `]` for an array.",
    "number": "Invalid number format: JSON numbers cannot contain commas or trailing characters.",
    "slash": "Unexpected slash `/`: 2 slashes `//` are required  for a comment",
    "backslash": "Unexpected backslash `\\`: escape sequences must be valid JSON escapes.",
    "escape": "Invalid escape sequence: must be like \\n, \\\", \\\\, \\uXXXX, etc.",
    "utf-8": "Invalid UTF-8 sequence: the text contains invalid or corrupted Unicode.",
    "control": "Invalid control character: unescaped control codes are not allowed in JSON strings.",
    "quote": "Unexpected quote `\"`: string might not be closed properly.",
}


def _friendly_message(msg: str) -> str:
    lower = msg.lower()

    # Match any known error pattern
    for key, explanation in ERROR_EXPLANATIONS.items():
        if key in lower:
            return explanation

    # Generic "Expected b'XYZ'"
    m = re.search(r"expected b'([^']+)'", lower)
    if m:
        return f"Unexpected token: expected `{m.group(1)}`."

    return msg


def pretty_json_error(input_string: str, error: Exception):
    msg = str(error)

    # -----------------------------
    # Extract positional info
    # -----------------------------
    pos = getattr(error, "pos", None)

    if pos is None:
        m = re.search(r"near\s+(\d+)", msg)
        if m:
            pos = int(m.group(1))

    if pos is None:
        m = re.search(r"char\s+(\d+)", msg)
        if m:
            pos = int(m.group(1))

    if pos is None:
        return msg

    # Compute line/column
    lines = input_string.splitlines()
    running = 0
    for i, line in enumerate(lines, start=1):
        if running + len(line) + 1 > pos:
            col = pos - running
            break
        running += len(line) + 1
    else:
        return msg

    pointer = " " * col + "^"
    explanation = _friendly_message(msg)

    return (
        f"{explanation}\n"
        f"Line {i}, column {col}:\n"
        f"    {lines[i-1]}\n"
        f"    {pointer}"
    )
