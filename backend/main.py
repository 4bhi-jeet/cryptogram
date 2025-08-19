import csv
import random
import hashlib
from collections import Counter, defaultdict


def load_quotes_from_csv(filename="backend/data.csv"):
  quotes = []
  with open(filename, mode="r", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
      quotes.append(row)
  return quotes

def get_random_quote():
  quotes = load_quotes_from_csv()
  return random.choice(quotes)

def generate_mapping():
  letters = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  numbers = list(range(1, 27))
  random.shuffle(numbers)
  return dict(zip(letters, numbers))

def encrypt_quote(quote, mapping):
  encrypted = []

  for char in quote.upper():
    if char in mapping:
      encrypted.append(str(mapping[char]))
    elif char == " ":
      encrypted.append(" ")
    else:
      encrypted.append(char)
  
  return " ".join(encrypted)

def hash_mapping(mapping):
  mapping_str = "".join(f"{k}:{v}" for k, v in sorted(mapping.items()))
  return hashlib.sha256(mapping_str.encode()).hexdigest()

def get_letters_count(quote):
  letters = [c for c in quote.upper() if c.isalpha()]
  total = len(letters)
  return total, dict(Counter(letters))

def pick_revealed_letters_by_percentage(quote: str, mapping: dict, percentage: float = 0.2):
    """
    Reveals a percentage of letters from the quote.
    Ensures not all instances of any letter are revealed.
    
    Returns a dict of revealed mapping: { 'A': 5, 'T': 19, ... }
    """
    letters_only = [c for c in quote.upper() if c.isalpha()]
    total_letters = len(letters_only)
    
    # how many positions to reveal
    reveal_count = max(1, int(total_letters * percentage))

    # track indices of each letter
    positions = defaultdict(list)
    for idx, char in enumerate(quote.upper()):
        if char.isalpha():
            positions[char].append(idx)

    revealed = {}
    revealed_letters = set()

    # try until we reveal enough letters
    attempts = 0
    while len(revealed) < reveal_count and attempts < total_letters * 3:
        attempts += 1
        char = random.choice(letters_only)

        # if already revealed this letter, skip
        if char in revealed_letters:
            continue

        # if this letter occurs multiple times, don’t reveal all of them
        if len(positions[char]) > 1:
            # allow revealing but keep other instances hidden
            revealed[char] = mapping[char]
            revealed_letters.add(char)
        else:
            # single occurrence, safe to reveal
            revealed[char] = mapping[char]
            revealed_letters.add(char)

    return revealed

def create_puzzle():

    quote_data = get_random_quote()

    quote = quote_data["Quote"]

    mapping = generate_mapping()

    encrypted = encrypt_quote(quote, mapping)

    mapping_hash = hash_mapping(mapping)

    revealed = pick_revealed_letters_by_percentage(quote, mapping, percentage=0.1)

    total, letter_counts = get_letters_count(quote)

    return {
      "encrypted": encrypted,
      "mapping_hash": mapping_hash,  # Hidden solution
      "mapping": mapping,
      "letter_counts": letter_counts,
      "total": total,
      "quote": quote,
      "revealed": revealed,
      "author": quote_data.get("Spoken by", ""),
      "who": quote_data.get("Who", ""),
      "book": quote_data.get("Book", ""),
      "year": quote_data.get("Year", "")
    }
