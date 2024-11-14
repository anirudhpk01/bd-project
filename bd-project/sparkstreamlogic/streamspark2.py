import findspark
findspark.init('/opt/spark')
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, window, floor
from pyspark.sql.types import StructType, StringType, LongType

# Spark session setup
spark = SparkSession.builder \
    .appName("KafkaEmojiStreaming") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.3") \
    .getOrCreate()

# Define the schema for the JSON data in the "value" field
schema = StructType() \
    .add("userId", StringType()) \
    .add("emojiType", StringType()) \
    .add("timestamp", LongType())

# Read from the Kafka topic
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "192.168.64.4:9092") \
    .option("subscribe", "emoji") \
    .option("startingOffsets", "latest") \
    .load()

# Extract the JSON data from the "value" column, decode it, and cast the fields based on the schema
json_df = df.select(from_json(col("value").cast("string"), schema).alias("data"))

# Select necessary fields and cast timestamp to a proper timestamp type
emoji_df = json_df.select("data.emojiType", (col("data.timestamp") / 1000).cast("timestamp").alias("timestamp"))

# Add watermark to handle late data and apply a time window of 2 seconds for aggregation
emoji_count_df = emoji_df \
    .withWatermark("timestamp", "2 seconds") \
    .groupBy(window(col("timestamp"), "2 seconds"), "emojiType") \
    .count() \
    .withColumnRenamed("count", "frequency")

# Apply logic to filter counts greater than or equal to 2 and display counts in batches of 2
final_df = emoji_count_df \
    .filter(col("frequency") >= 2) \
    .withColumn("batches", floor(col("frequency") / 2)) \
    .select("window", "emojiType", "batches") \
    .withColumnRenamed("batches", "frequency")

# Start the query to process the data in batches of 2 seconds
query = final_df \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .trigger(processingTime="2 seconds") \
    .option("truncate", "false") \
    .start()

query.awaitTermination()
