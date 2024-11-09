from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, count, expr, desc
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

# Initialize Spark session
spark = SparkSession.builder \
    .appName("KafkaEmojiStreaming") \
    .getOrCreate()

# Set log level to ERROR to suppress informational and warning messages
spark.sparkContext.setLogLevel("ERROR")

# Define the schema for incoming JSON data with emoji support
schema = StructType([
    StructField("id", StringType(), True),
    StructField("name", StringType(), True),
    StructField("emoji", StringType(), True),  # Emoji field as StringType
    StructField("age", IntegerType(), True),
    StructField("city", StringType(), True)
])

# Define a mapping for emoji normalization (grouping similar emojis)
emoji_mapping = {
    "😊": "Happy",
    "😀": "Happy",
    "😁": "Happy",
    "🚀": "Rocket",
    "🎉": "Celebration",
    "🎁": "Gift",
    "🍕": "Food",
    "🥳": "Celebration",
    "🦄": "Fantasy",
    "⚡": "Electric",
    "🌟": "Star",
    "💥": "Explosion",
    "🎮": "Game",
    "👽": "Alien",
    "💎": "Gem",
    "🍀": "Good Luck",
    "🦋": "Nature",
    "🎂": "Birthday",
    "🍉": "Fruit",
    "🌈": "Rainbow",
    "👑": "Crown",
    "👻": "Ghost",
    "💡": "Idea",
    "🍩": "Donut"
}

# Read data from Kafka
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "your_topic") \
    .option("startingOffsets", "latest") \
    .load()

# Parse the JSON data in the Kafka message
json_df = df.selectExpr("CAST(value AS STRING) as json_value") \
    .select(from_json("json_value", schema).alias("data")) \
    .select("data.*")

# Apply the emoji mapping using `expr` (for SQL-style expressions)
mapped_emoji_df = json_df.withColumn(
    "normalized_emoji", expr(
        "CASE " +
        "WHEN emoji = '😊' THEN 'Happy' " +
        "WHEN emoji = '😀' THEN 'Happy' " +
        "WHEN emoji = '😁' THEN 'Happy' " +
        "WHEN emoji = '🚀' THEN 'Rocket' " +
        "WHEN emoji = '🎉' THEN 'Celebration' " +
        "WHEN emoji = '🎁' THEN 'Gift' " +
        "WHEN emoji = '🍕' THEN 'Food' " +
        "WHEN emoji = '🥳' THEN 'Celebration' " +
        "WHEN emoji = '🦄' THEN 'Fantasy' " +
        "WHEN emoji = '⚡' THEN 'Electric' " +
        "WHEN emoji = '🌟' THEN 'Star' " +
        "WHEN emoji = '💥' THEN 'Explosion' " +
        "WHEN emoji = '🎮' THEN 'Game' " +
        "WHEN emoji = '👽' THEN 'Alien' " +
        "WHEN emoji = '💎' THEN 'Gem' " +
        "WHEN emoji = '🍀' THEN 'Good Luck' " +
        "WHEN emoji = '🦋' THEN 'Nature' " +
        "WHEN emoji = '🎂' THEN 'Birthday' " +
        "WHEN emoji = '🍉' THEN 'Fruit' " +
        "WHEN emoji = '🌈' THEN 'Rainbow' " +
        "WHEN emoji = '👑' THEN 'Crown' " +
        "WHEN emoji = '👻' THEN 'Ghost' " +
        "WHEN emoji = '💡' THEN 'Idea' " +
        "WHEN emoji = '🍩' THEN 'Donut' " +
        "ELSE emoji END"
    )
)

# Perform transformations (filter age above 18)
filtered_df = mapped_emoji_df.filter(col("age") > 18)

# Group by normalized emoji and count the occurrences
emoji_counts_df = filtered_df.groupBy("normalized_emoji").agg(count("normalized_emoji").alias("count"))

# Sort by the count to find the most frequent emoji
sorted_emoji_df = emoji_counts_df.orderBy(desc("count"))

# Write the output to the console with a 2-second trigger interval for micro-batching
def write_to_console(df, epoch_id):
    # If the dataframe is empty, output a message
    if df.isEmpty():
        print("No data in this batch")
    else:
        # Show the top emoji directly in the batch
        top_emoji = df.limit(1).collect()  # Collect the top emoji in the batch
        if top_emoji:
            representative_emoji = top_emoji[0]['normalized_emoji']
            highest_count = top_emoji[0]['count']
            # Print representative emoji and its count
            print(f"Representative Emoji: {representative_emoji} with count: {highest_count}")
        
        # Display the entire table of emoji counts (optional)
        df.show(truncate=False)  # Show the entire aggregated output

query = sorted_emoji_df.writeStream \
    .outputMode("complete") \
    .foreachBatch(write_to_console) \
    .trigger(processingTime="2 seconds") \
    .start()

# Await termination of the stream
query.awaitTermination()

