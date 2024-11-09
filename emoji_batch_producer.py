from kafka import KafkaProducer
import json
import time

# Configure the Kafka producer
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')  # Serialize data to JSON and UTF-8
)

# Define a list of JSON messages to send, including various emojis and data
messages = [
    {"id": "1", "name": "Alice", "emoji": "😊", "age": 25, "city": "NY"},
    {"id": "2", "name": "Bob", "emoji": "🚀", "age": 29, "city": "LA"},
    {"id": "3", "name": "Charlie", "emoji": "😊", "age": 22, "city": "SF"},
    {"id": "4", "name": "David", "emoji": "😊", "age": 30, "city": "Chicago"},
    {"id": "5", "name": "Eve", "emoji": "😊", "age": 27, "city": "Miami"},  # Age < 18 for filtering test
    {"id": "6", "name": "Frank", "emoji": "😊", "age": 30, "city": "Dallas"},
    {"id": "7", "name": "Grace", "emoji": "🎉", "age": 25, "city": "Boston"},
    {"id": "8", "name": "Heidi", "emoji": "🎉", "age": 23, "city": "Seattle"},
    {"id": "9", "name": "Ivan", "emoji": "🌟", "age": 40, "city": "Austin"},
    {"id": "10", "name": "Judy", "emoji": "🎉", "age": 28, "city": "Chicago"},
    {"id": "11", "name": "Ken", "emoji": "💥", "age": 35, "city": "Houston"},
    {"id": "12", "name": "Liam", "emoji": "🎉", "age": 29, "city": "Phoenix"},
    {"id": "13", "name": "Mona", "emoji": "🎁", "age": 21, "city": "Denver"},
    {"id": "14", "name": "Nina", "emoji": "🎉", "age": 26, "city": "Boston"},
    {"id": "15", "name": "Oscar", "emoji": "🍕", "age": 32, "city": "NY"},
    {"id": "16", "name": "Paul", "emoji": "🥳", "age": 33, "city": "LA"},
    {"id": "17", "name": "Quincy", "emoji": "🎂", "age": 27, "city": "Chicago"},
    {"id": "18", "name": "Rachel", "emoji": "🦄", "age": 24, "city": "Seattle"},
    {"id": "19", "name": "Sam", "emoji": "⚡", "age": 31, "city": "Austin"},
    {"id": "20", "name": "Tom", "emoji": "🎮", "age": 23, "city": "Phoenix"},
    {"id": "21", "name": "Uma", "emoji": "🦋", "age": 29, "city": "NY"},
    {"id": "22", "name": "Vera", "emoji": "🍀", "age": 28, "city": "LA"},
    {"id": "23", "name": "Will", "emoji": "🌈", "age": 32, "city": "SF"},
    {"id": "24", "name": "Xander", "emoji": "👑", "age": 27, "city": "Chicago"},
    {"id": "25", "name": "Yara", "emoji": "💎", "age": 34, "city": "Houston"},
    {"id": "26", "name": "Zane", "emoji": "🍉", "age": 21, "city": "Miami"},
    {"id": "27", "name": "Abby", "emoji": "👻", "age": 22, "city": "Denver"},
    {"id": "28", "name": "Benny", "emoji": "💡", "age": 24, "city": "Dallas"},
    {"id": "29", "name": "Cathy", "emoji": "🍩", "age": 26, "city": "Austin"},
    {"id": "30", "name": "Dean", "emoji": "👽", "age": 29, "city": "NY"},
    {"id": "31", "name": "Alice", "emoji": "😊", "age": 25, "city": "NY"},
    {"id": "32", "name": "Bob", "emoji": "🚀", "age": 29, "city": "LA"},
    {"id": "33", "name": "Charlie", "emoji": "😊", "age": 22, "city": "SF"},
    {"id": "34", "name": "David", "emoji": "😊", "age": 30, "city": "Chicago"},
    {"id": "35", "name": "Eve", "emoji": "😊", "age": 27, "city": "Miami"},  # Age < 18 for filtering test
    {"id": "36", "name": "Frank", "emoji": "😊", "age": 30, "city": "Dallas"},
    {"id": "37", "name": "Grace", "emoji": "🎉", "age": 25, "city": "Boston"},
    {"id": "38", "name": "Heidi", "emoji": "🎉", "age": 23, "city": "Seattle"},
    {"id": "39", "name": "Ivan", "emoji": "🌟", "age": 40, "city": "Austin"},
    {"id": "40", "name": "Judy", "emoji": "🎉", "age": 28, "city": "Chicago"},
    {"id": "41", "name": "Ken", "emoji": "💥", "age": 35, "city": "Houston"},
    {"id": "42", "name": "Liam", "emoji": "🎉", "age": 29, "city": "Phoenix"},
    {"id": "43", "name": "Mona", "emoji": "🎁", "age": 21, "city": "Denver"},
    {"id": "44", "name": "Nina", "emoji": "🎉", "age": 26, "city": "Boston"},
    {"id": "45", "name": "Oscar", "emoji": "🍕", "age": 32, "city": "NY"},
    {"id": "46", "name": "Paul", "emoji": "🥳", "age": 33, "city": "LA"},
    {"id": "47", "name": "Quincy", "emoji": "🎂", "age": 27, "city": "Chicago"},
    {"id": "48", "name": "Rachel", "emoji": "🦄", "age": 24, "city": "Seattle"},
    {"id": "49", "name": "Sam", "emoji": "⚡", "age": 31, "city": "Austin"},
    {"id": "50", "name": "Tom", "emoji": "🎮", "age": 23, "city": "Phoenix"},
]

# Send each message to the Kafka topic with a small delay
for message in messages:
    try:
        producer.send('your_topic', value=message)
        print(f"Sent message: {message}")
        time.sleep(1)  # Delay of 1 second between each message
    except Exception as e:
        print(f"Error sending message: {e}")

# Ensure all messages are sent
producer.flush()

print("All messages sent successfully to Kafka")

