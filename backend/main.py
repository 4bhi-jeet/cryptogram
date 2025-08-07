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

if __name__ == "__main__":
  quotes = get_random_quote()
  mapping = generate_mapping()
  print(quotes)
  print("Quote:", quotes["quote"])
  print("Mapping:", mapping)