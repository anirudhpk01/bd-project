import findspark
findspark.init('/home/hadoopu/spark-3.5.3-bin-hadoop3')
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
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "emoji") \
    .option("startingOffsets", "latest") \
    .option("failOnDataLoss", "false") \
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
    .filter(col("count") >= 2)  # Only keep entries with frequency >= 2

# Apply a proper window duration to make sure batches are being processed in chunks
final_df = emoji_count_df \
    .withColumn("batches", (col("count") / 2).cast("integer")) \
    .select("window", "emojiType", "batches") \
    .withColumnRenamed("batches", "frequency")

# Prepare data to send to Kafka
kafka_df = final_df.selectExpr("CAST(emojiType AS STRING) AS key", "TO_JSON(struct(*)) AS value")



# Write the data to a Kafka topic
# Write the data to a Kafka topic with checkpoint location
query = kafka_df \
    .writeStream \
    .outputMode("append") \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "emoji-counts") \
    .option("checkpointLocation", "/home/hadoopu/bd-project/sparkstreamlogic/checkpoints")\
    .trigger(processingTime="2 seconds") \
    .start()

query.awaitTermination()


