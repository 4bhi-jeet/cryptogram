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
  selected = random.choice(all_quotes)
  return {
    "quote": selected["quote"],
    "author": selected["author"],
    "book": selected["book"],
    "year": selected["year"]
  }

if __name__ == "__main__":
  quotes = get_random_quote()
  print(quotes)