import csv
import random
import hashlib

def load_quotes_from_csv(filename="backend/data.csv"):
  quotes = []
  with open(filename, mode="r", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
      quotes.append(row)
  return quotes

def get_random_quote():
  quotes = load_quotes_from_csv()
  print(random.choice(quotes))
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

def create_puzzle():
    # Step 1: Get random quote
    quote_data = get_random_quote()
    
    # Step 2: Generate mapping
    mapping = generate_mapping()
    
    # Step 3: Encrypt quote
    encrypted = encrypt_quote(quote_data["Quote"], mapping)

    mapping_hash = hash_mapping(mapping)
    
    # Step 4: Bundle everything
    return {
      "encrypted_quote": encrypted,
      "mapping_hash": mapping_hash,  # Hidden solution
      "author": quote_data["Spoken by"],
      "book": quote_data["Book"],
      "year": quote_data["Year"]
    }

if __name__ == "__main__":
  puzzle = create_puzzle()
  #print("Encrypted Quote:", puzzle["encrypted_quote"])
  #print("Mapping:", puzzle["mapping"])
  #print(f'— {puzzle["author"]}, {puzzle["book"]} ({puzzle["year"]})')