#!/usr/bin/env python3
"""Convert the mosque's yearly prayer-time table (PDF) into the site's JSON format.

Usage:
    pdftotext -layout table.pdf table.txt
    python3 scripts/parse-prayer-table.py table.txt 2027 src/data/prayer-times/2027.json

`pdftotext` is part of poppler-utils (Ubuntu/Debian: `sudo apt install poppler-utils`,
macOS: `brew install poppler`). The script itself only needs Python 3 (no packages).

Expected input
--------------
The mosque publishes one PDF per year, exported from Excel. Converted with
`pdftotext -layout`, it looks like this:

* Two blocks: the first covers January-June, the second July-December. The
  second block starts at the first line containing the word "Juli".
* Each row starts with the day of the month, followed - for every month of the
  block that has that day - by a group "<day> <fajr> <sunrise> <dhuhr> <asr>
  <maghrib> <isha>" (times as HH:MM). Rows 29-31 therefore have fewer groups
  (e.g. no February on day 30).
* The December column is sometimes too wide, so pdftotext wraps its six times
  onto a continuation line that contains only times. Such lines are appended to
  the previous row before parsing.

Output
------
A JSON object keyed by ISO date, sorted, e.g.
    {"2027-01-01": {"fajr": "06:25", "sunrise": "08:24", "dhuhr": "12:29",
                    "asr": "14:06", "maghrib": "16:25", "isha": "18:11"}, ...}
(written with one key/value per line, like the existing files).

Checks
------
Rows where the number of time groups does not match the number of months that
have that day are reported as MISMATCH on stderr and skipped. The number of
parsed days is printed at the end: it must be 365 (366 in a leap year). If it
is not, compare the text file with the PDF and fix the text file by hand.
"""

import calendar
import json
import re
import sys

PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
TIME = r"(\d{2}:\d{2})"
# One month's group: day number followed by six times.
GROUP = re.compile(r"(\d{1,2})\s+" + r"\s+".join([TIME] * 6))
# A wrapped December column: a line consisting of exactly six times.
CONTINUATION = re.compile(r"(\d{2}:\d{2}\s*){6}")


def merge_continuation_lines(raw_lines):
    """Append lines that contain only six times to the previous line."""
    lines = []
    for line in raw_lines:
        stripped = line.strip()
        if stripped and CONTINUATION.fullmatch(stripped) and lines:
            lines[-1] = lines[-1].rstrip() + " " + stripped
        else:
            lines.append(line)
    return lines


def parse(text, year):
    lines = merge_continuation_lines(text.splitlines())
    # The second half of the year starts at the first line mentioning "Juli".
    split = next((i for i, line in enumerate(lines) if "Juli" in line), None)
    if split is None:
        sys.exit('Error: no line containing "Juli" found - is this the yearly table?')

    data = {}
    for block, months in ((lines[:split], range(1, 7)), (lines[split:], range(7, 13))):
        for line in block:
            groups = GROUP.findall(line)
            if not groups:
                continue
            day = int(groups[0][0])
            # Months of this block that actually have this day (e.g. no 30 Feb).
            month_list = [m for m in months if calendar.monthrange(year, m)[1] >= day]
            if len(groups) != len(month_list):
                print("MISMATCH", day, months, len(groups), len(month_list), file=sys.stderr)
                continue
            for month, group in zip(month_list, groups):
                assert int(group[0]) == day, f"day column mismatch in line: {line!r}"
                data[f"{year}-{month:02d}-{day:02d}"] = dict(zip(PRAYERS, group[1:]))
    return dict(sorted(data.items()))


def main(argv):
    if len(argv) != 4:
        print(__doc__.split("Expected input")[0].strip(), file=sys.stderr)
        sys.exit(2)
    txt_path, year, out_path = argv[1], int(argv[2]), argv[3]
    with open(txt_path, encoding="utf-8") as f:
        data = parse(f.read(), year)

    expected = 366 if calendar.isleap(year) else 365
    print(f"{len(data)} days parsed (expected {expected})", file=sys.stderr)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=0)
    if len(data) != expected:
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
