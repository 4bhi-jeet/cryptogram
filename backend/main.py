import csv
import random

def load_quotes_from_csv(filename="backend/data.csv"):
  quotes = []
  with open(filename, mode="r", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
      quotes.append({
        "quote": row["Quote"],
        "author": row["Spoken by"],
        "role": row["Who"],
        "year": row["Year"],
        "book": row["Book"]
      })
  return quotes

def get_random_quote():
  all_quotes = load_quotes_from_csv()
  return random.choice(all_quotes)

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

def create_puzzle():
    # Step 1: Get random quote
    quote_data = get_random_quote()
    
    # Step 2: Generate mapping
    mapping = generate_mapping()
    
    # Step 3: Encrypt quote
    encrypted = encrypt_quote(quote_data["quote"], mapping)
    
    # Step 4: Bundle everything
    return {
        "encrypted_quote": encrypted,
        "mapping": mapping,  # Later we might hide or hash this
        "author": quote_data["author"],
        "book": quote_data["book"],
        "year": quote_data["year"]
    }

if __name__ == "__main__":
  puzzle = create_puzzle()
  print("Encrypted Quote:", puzzle["encrypted_quote"])
  print("Mapping:", puzzle["mapping"])
  print(f'— {puzzle["author"]}, {puzzle["book"]} ({puzzle["year"]})')