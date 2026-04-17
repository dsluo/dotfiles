---
name: apache-spark
description: Apache Spark data engineering expert for Spark SQL, DataFrames, Datasets, structured streaming, data sources (Parquet, ORC, CSV, JSON, JDBC, Avro), partitioning, bucketing, caching, AQE, performance tuning, serialization (Kryo), memory management, configuration, declarative pipelines, and PySpark/Scala/Java APIs. Use when designing, building, or troubleshooting Spark data engineering solutions.
---

# Apache Spark Data Engineering Expert Skill

## Description
This skill enables the assistant to act as an Apache Spark data engineering expert, providing comprehensive guidance on Spark's core APIs, data processing patterns, performance optimization, and best practices. This covers Spark SQL, DataFrames, Datasets, structured streaming, data sources, partitioning, bucketing, caching, Adaptive Query Execution (AQE), memory management, and all three primary APIs (PySpark, Scala, Java).

## Version
1.0.0

## Topics
- SparkSession & Core Concepts
- DataFrames & Datasets API
- Spark SQL & SQL Syntax
- Data Sources (Parquet, ORC, CSV, JSON, Avro, JDBC, Text, XML)
- Load/Save Patterns & Save Modes
- Partitioning, Bucketing & Sorting
- Schema Management & Evolution
- Caching & Persistence
- Adaptive Query Execution (AQE)
- Join Strategies & Broadcast Joins
- Performance Tuning & Optimization
- Serialization (Java vs Kryo)
- Memory Management
- Configuration & Spark Properties
- Structured Streaming
- Declarative Pipelines
- PySpark with Apache Arrow
- Built-in SQL Functions
- Runtime Filters & Bloom Filters
- Storage Partition Join

## Knowledge Base

### What is Apache Spark?
Apache Spark is a unified analytics engine for large-scale data processing. It provides high-level APIs in Java, Scala, Python (PySpark), and R, and an optimized engine supporting general execution graphs. Key modules include:
- **Spark SQL** - SQL and structured data processing
- **pandas API on Spark** - pandas workloads at scale
- **MLlib** - machine learning (out of scope for DE)
- **Structured Streaming** - incremental/streaming computation
- **GraphX** - graph processing (out of scope for DE)

**Supported Languages:** Scala 2.13, Java 17/21, Python 3.10+, R 3.5+ (deprecated)
**Default Serialization:** Kryo for simple types/arrays/strings (since 2.0), Java for custom objects

### SparkSession - The Entry Point
```python
# Python
from pyspark.sql import SparkSession
spark = SparkSession.builder \
    .appName("MyApp") \
    .config("spark.some.config.option", "value") \
    .getOrCreate()
```

```scala
// Scala
import org.apache.spark.sql.SparkSession
val spark = SparkSession.builder()
    .appName("MyApp")
    .config("spark.some.config.option", "value")
    .getOrCreate()
```

```java
// Java
import org.apache.spark.sql.SparkSession;
SparkSession spark = SparkSession.builder()
    .appName("MyApp")
    .config("spark.some.config.option", "value")
    .getOrCreate();
```

Key points:
- `SparkSession` is the single entry point for all Spark functionality
- Provides builtin support for Hive features (HiveQL, Hive UDFs, Hive tables) — no separate Hive installation needed
- Temporary views are session-scoped; global temporary views persist across sessions (tied to `global_temp` database)
- `spark.newSession()` creates a new session sharing the same SparkContext

### DataFrames vs Datasets
| Feature | DataFrame | Dataset |
|---------|-----------|---------|
| Type safety | No (Row objects) | Yes (strongly typed) |
| Python support | Yes | No |
| R support | Yes | No |
| Scala/Java | Yes (alias for `Dataset[Row]`) | Scala & Java only |
| Best for | General purpose, dynamic schemas | Compile-time safety, case classes |

**Dataset creation in Scala:**
```scala
import spark.implicits._

case class Person(name: String, age: Long)

val caseClassDS = Seq(Person("Andy", 32)).toDS()
val primitiveDS = Seq(1, 2, 3).toDS()
val peopleDS = spark.read.json("people.json").as[Person]
```

**Interoperating with RDDs:**
```python
# From RDD to DataFrame via Row objects
from pyspark.sql import Row
people = rdd.map(lambda p: Row(name=p[0], age=int(p[1])))
df = spark.createDataFrame(people)

# Programmatically specifying schema
from pyspark.sql.types import StructType, StructField, StringType, LongType
schema = StructType([
    StructField("name", StringType(), True),
    StructField("age", LongType(), True)
])
df = spark.createDataFrame(rdd, schema)
```

### DataFrame Operations (Core DE Transformations)
```python
# Basic operations
df.printSchema()                          # Print schema tree
df.select("name", "age")                  # Select columns
df.select(df["name"], (df["age"] + 1))    # Expressions
df.filter(df["age"] > 21)                 # Filter rows
df.groupBy("age").count()                 # Group and aggregate
df.agg({"age": "avg", "name": "count"})   # Custom aggregations
df.sort("age", ascending=False)           # Sort
df.dropDuplicates(["name"])               # Remove duplicates
df.withColumn("age_plus_1", df["age"] + 1) # Add derived column
df.drop("age")                            # Remove column
df.withColumnRenamed("age", "user_age")   # Rename column
df.limit(10)                              # Limit rows
df.union(df2) / df.unionByName(df2)       # Union
df.join(df2, "id")                        # Join (inner, left, right, full)
df.crossJoin(df2)                         # Cross join
df.exceptAll(df2) / df.subtract(df2)      # Set operations
df.distinct()                             # Distinct rows
```

**Running SQL queries programmatically:**
```python
df.createOrReplaceTempView("people")
sqlDF = spark.sql("SELECT name, age FROM people WHERE age BETWEEN 13 AND 19")
```

### Data Sources

#### Generic Load/Save
```python
# Default source is Parquet
df = spark.read.load("path/to/data")
df.write.save("path/to/output")

# Specify format and options
df = spark.read.format("parquet").load("path")
df = spark.read.format("csv").option("header", "true") \
           .option("inferSchema", "true") \
           .option("sep", ";") \
           .load("path")

# Save modes
df.write.mode("overwrite").parquet("output")    # Overwrite existing
df.write.mode("append").parquet("output")       # Append to existing
df.write.mode("ignore").parquet("output")       # Skip if exists
df.write.mode("error" or "errorifexists").parquet("output")  # Fail if exists (default)
```

**Save Modes:**
| Mode | Meaning |
|------|---------|
| `error` / `errorifexists` (default) | Throw exception if data exists |
| `append` | Append DataFrame contents to existing data |
| `overwrite` | Delete existing data and write new data |
| `ignore` | Do nothing if data exists (like CREATE TABLE IF NOT EXISTS) |

#### Parquet Files (Recommended Default Format)
Parquet is the default data source. It's a columnar format that preserves schema automatically.

```python
# Read Parquet (schema is self-describing)
df = spark.read.parquet("people.parquet")

# Write Parquet with compression
df.write.option("compression", "zstd").parquet("output")

# Partition discovery from directory structure
df = spark.read.parquet("path/to/table/")
# Schema auto-infers: gender, country from path: path/to/table/gender=male/country=US/

# Schema merging (disabled by default)
df = spark.read.option("mergeSchema", "true").parquet("path")
```

**Key Parquet Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.sql.parquet.compression.codec` | `snappy` | Compression codec (none, snappy, gzip, zstd, lz4, brotli) |
| `spark.sql.parquet.filterPushdown` | `true` | Enable filter pushdown |
| `spark.sql.parquet.enableVectorizedReader` | `true` | Enable vectorized reading |
| `spark.sql.parquet.mergeSchema` | `false` | Merge schemas across files |
| `spark.sql.parquet.aggregatePushdown` | `false` | Push down MIN/MAX/COUNT aggregates |
| `spark.sql.parquet.columnarReaderBatchSize` | `4096` | Rows per vectorized read batch |

**Partition Discovery:**
```
path/to/table/
├── gender=male/
│   ├── country=US/
│   │   └── data.parquet
│   └── country=CN/
│       └── data.parquet
└── gender=female/
    ├── country=US/
    │   └── data.parquet
```

Spark auto-infers `gender` and `country` as partition columns from the directory names.

#### ORC Files
```python
# Read ORC
df = spark.read.orc("people.orc")

# Write ORC with options
df.write.format("orc") \
    .option("orc.bloom.filter.columns", "favorite_color") \
    .option("orc.dictionary.key.threshold", "1.0") \
    .option("orc.column.encoding.direct", "name") \
    .save("output.orc")
```

**Key ORC Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.sql.orc.compression.codec` | `zstd` | Compression codec |
| `spark.sql.orc.filterPushdown` | `true` | Enable filter pushdown |
| `spark.sql.orc.enableVectorizedReader` | `true` | Enable vectorized reading |
| `spark.sql.orc.mergeSchema` | `false` | Merge schemas across files |

#### CSV Files
```python
df = spark.read.format("csv") \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", ",") \
    .option("multiLine", "true") \
    .option("quote", "\"") \
    .option("escape", "\"") \
    .option("nullValue", "") \
    .option("encoding", "utf-8") \
    .load("data.csv")
```

#### JSON Files
```python
df = spark.read.format("json").load("data.json")
# Supports single-line and multi-line JSON
```

#### Avro Files
```python
df = spark.read.format("avro").load("data.avro")
df.write.format("avro").save("output.avro")
```

#### JDBC to Other Databases
```python
# Read from JDBC
df = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://dbserver/sales") \
    .option("dbtable", "customers") \
    .option("user", "user") \
    .option("password", "pass") \
    .option("driver", "org.postgresql.Driver") \
    .load()

# With partitioning for parallel reads
df = spark.read.format("jdbc") \
    .option("url", "...") \
    .option("dbtable", "(SELECT * FROM customers) AS cust") \
    .option("lowerBound", "1") \
    .option("upperBound", "1000000") \
    .option("numPartitions", "10") \
    .option("driver", "org.postgresql.Driver") \
    .load()
```

### Partitioning, Bucketing & Sorting

#### Partitioning (for file-based sources)
Partitioning creates a directory structure based on column values. Best for low-to-medium cardinality columns.

```python
# Write with partitioning
df.write.partitionBy("date", "region").parquet("output/")
# Creates: output/date=2024-01-01/region=US/...

# SQL
CREATE TABLE sales_by_date
USING parquet
PARTITIONED BY (date, region)
AS SELECT * FROM sales;
```

**Key considerations:**
- Limited applicability for high-cardinality columns (too many directories)
- Partition pruning eliminates unread directories during reads
- Use `MSCK REPAIR TABLE` to sync partition metadata for external tables

#### Bucketing (persistent tables only)
Bucketing distributes data across a fixed number of buckets using a hash function. Best for join optimization.

```python
# Write with bucketing and sorting
df.write.bucketBy(42, "customer_id").sortBy("date") \
    .saveAsTable("sales_bucketed")

# SQL
CREATE TABLE sales_bucketed
USING parquet
CLUSTERED BY(customer_id) SORTED BY(date ASC) INTO 42 BUCKETS
AS SELECT * FROM sales;
```

**Key considerations:**
- Fixed number of buckets regardless of data size
- Enables bucket map joins (no shuffle needed for matching bucket counts)
- Can be combined with partitioning: `.partitionBy("region").bucketBy(42, "customer_id")`

#### Combined Partitioning + Bucketing
```python
df.write \
    .partitionBy("date") \
    .bucketBy(42, "customer_id") \
    .saveAsTable("sales_partitioned_bucketed")
```

### Schema Management

#### Schema Merging (Parquet/ORC)
```python
# Enable schema merging when reading
df = spark.read.option("mergeSchema", "true").parquet("path")
# OR set globally
spark.conf.set("spark.sql.parquet.mergeSchema", "true")
```

#### Schema Evolution Patterns
```python
# Start simple, add columns over time
df1 = spark.createDataFrame([(1, "a")], ["id", "name"])
df1.write.parquet("table/key=1")

df2 = spark.createDataFrame([(2, "b", 100)], ["id", "name", "value"])
df2.write.parquet("table/key=2")

# Merge all schemas
merged = spark.read.option("mergeSchema", "true").parquet("table")
# Result: id, name, value, key
```

### Caching & Persistence

```python
# Cache in memory (columnar format for Spark SQL)
df.cache()
spark.catalog.cacheTable("tableName")

# Unpersist
df.unpersist()
spark.catalog.uncacheTable("tableName")

# Checkpoint for fault tolerance
df.checkpoint(eager=True)
```

**In-Memory Columnar Caching Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.sql.inMemoryColumnarStorage.compressed` | `true` | Auto-select compression codec per column |
| `spark.sql.inMemoryColumnarStorage.batchSize` | `10000` | Rows per columnar batch |
| `spark.sql.defaultCacheStorageLevel` | `MEMORY_AND_DISK` | Default cache storage level (Spark 4.0+) |

**Storage Levels:**
- `MEMORY_ONLY` — Deserialized, fast access, higher memory usage
- `MEMORY_ONLY_SER` — Serialized, less memory, slower access
- `MEMORY_AND_DISK` — Spills to disk when memory is full
- `MEMORY_AND_DISK_SER` — Serialized + disk spill (recommended for streaming)
- `OFF_HEAP` — Off-heap memory (reduces GC pressure)

### Adaptive Query Execution (AQE)
Enabled by default since Spark 3.2. Re-optimizes query plans at runtime using accurate statistics.

```python
# Enable/disable AQE
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Coalesce small shuffle partitions
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")

# Handle data skew in joins
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5.0")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

# Split small partitions during rebalance
spark.conf.set("spark.sql.adaptive.optimizeSkewsInRebalancePartitions.enabled", "true")
```

**AQE Key Features:**
1. **Coalescing Post-Shuffle Partitions** — Merges small partitions to avoid too many tiny tasks
2. **Splitting Skewed Partitions** — Dynamically handles skew by splitting oversized partitions
3. **Converting Sort-Merge to Broadcast Join** — When runtime stats show one side is small enough
4. **Converting Sort-Merge to Shuffled Hash Join** — When partitions are small enough for local hash build
5. **Optimizing Skew Join** — Splits and replicates skewed partitions

**AQE Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.sql.adaptive.enabled` | `true` | Enable AQE |
| `spark.sql.adaptive.advisoryPartitionSizeInBytes` | `64MB` | Target partition size |
| `spark.sql.adaptive.coalescePartitions.enabled` | `true` | Coalesce small partitions |
| `spark.sql.adaptive.coalescePartitions.parallelismFirst` | `true` | Prioritize parallelism over target size |
| `spark.sql.adaptive.skewJoin.enabled` | `true` | Handle skewed joins |
| `spark.sql.adaptive.localShuffleReader.enabled` | `true` | Read shuffle data locally |

### Join Strategies

#### Broadcast Joins
Broadcast joins are ideal when one table is small enough to fit in memory.

```python
# Automatic broadcast (below threshold)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "10485760")  # 10MB default

# Explicit broadcast hint
from pyspark.sql.functions import broadcast
df1.join(broadcast(df2), "key")

# SQL hint
SELECT /*+ BROADCAST(r) */ * FROM src s JOIN records r ON s.key = r.key
```

**Broadcast Join Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.sql.autoBroadcastJoinThreshold` | `10MB` | Max table size for broadcast |
| `spark.sql.broadcastTimeout` | `300s` | Timeout for broadcast wait |
| `spark.sql.shuffledHashJoinFactor` | `3` | Factor for shuffled hash join selection |

#### Join Strategy Hints
```python
# BROADCAST — force broadcast join
df1.join(df2.hint("broadcast"), "key")

# MERGE — force sort-merge join
df1.join(df2.hint("merge"), "key")

# SHUFFLE_HASH — force shuffled hash join
df1.join(df2.hint("shuffle_hash"), "key")

# SHUFFLE_REPLICATE_NL — force shuffled nested loop join
df1.join(df2.hint("shuffle_replicate_nl"), "key")
```

**Join hint priority:** `BROADCAST` > `MERGE` > `SHUFFLE_HASH` > `SHUFFLE_REPLICATE_NL`

### Performance Tuning

#### Partition Tuning
```python
# Shuffle partitions (for joins/aggregations)
spark.conf.set("spark.sql.shuffle.partitions", "200")  # Default

# File partition sizing
spark.conf.set("spark.sql.files.maxPartitionBytes", "134217728")  # 128MB default
spark.conf.set("spark.sql.files.minPartitionNum", "1")
spark.conf.set("spark.sql.files.maxPartitionNum", "10000")
spark.conf.set("spark.sql.files.openCostInBytes", "4194304")  # 4MB default
```

**Coalesce Hints (control output files):**
```python
SELECT /*+ COALESCE(3) */ * FROM t           -- Reduce to 3 output files
SELECT /*+ REPARTITION(3) */ * FROM t        -- Repartition to 3
SELECT /*+ REPARTITION(c) */ * FROM t        -- Repartition by column
SELECT /*+ REPARTITION_BY_RANGE(c) */ * FROM t  -- Range partition by column
```

#### Leveraging Statistics
```sql
-- Collect table statistics
ANALYZE TABLE my_table COMPUTE STATISTICS;
ANALYZE TABLE my_table COMPUTE STATISTICS FOR COLUMNS col1, col2;

-- Inspect statistics
DESCRIBE EXTENDED my_table;

-- Inspect query plan estimates
EXPLAIN COST SELECT ...;
df.explain(mode="cost")
```

**Statistics Sources:**
- **Data source metadata** — Parquet/ORC file footers (min/max counts)
- **Catalog** — Hive Metastore (updated via ANALYZE TABLE)
- **Runtime** — AQE computes statistics during execution

#### Runtime Bloom Filters
```python
# Enable runtime bloom filters (Spark 3.3+)
spark.conf.set("spark.sql.optimizer.runtime.bloomFilter.enabled", "true")
spark.conf.set("spark.sql.optimizer.runtime.bloomFilter.expectedNumItems", "1000000")
spark.conf.set("spark.sql.optimizer.runtime.bloomFilter.maxNumBits", "67108864")
```

#### Storage Partition Join
Avoids shuffle by leveraging existing storage layout (bucketed/partitioned tables):
```python
spark.conf.set("spark.sql.sources.v2.bucketing.enabled", "true")
spark.conf.set("spark.sql.sources.v2.bucketing.pushPartValues.enabled", "true")
```

### Data Serialization

#### Kryo vs Java Serialization
| Aspect | Java Serialization | Kryo Serialization |
|--------|-------------------|-------------------|
| Speed | Slow | Up to 10x faster |
| Size | Larger | More compact |
| Registration | Not required | Recommended for best performance |
| Flexibility | Any Serializable | Requires class registration |

```python
# Set Kryo serializer
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

# Register custom classes (Scala/Java)
conf.registerKryoClasses(Array(classOf[MyClass1], classOf[MyClass2]))

# Or use a registrator class
conf.set("spark.kryo.registrator", "com.example.MyRegistrator")
```

**Key Serialization Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.serializer` | JavaSerializer | Serializer class |
| `spark.kryo.registrationRequired` | `false` | Require class registration |
| `spark.kryoserializer.buffer` | `64k` | Initial Kryo buffer size |
| `spark.kryoserializer.buffer.max` | `64m` | Max Kryo buffer size |
| `spark.kryo.unsafe` | `true` | Use unsafe-based Kryo |
| `spark.rdd.compress` | `false` | Compress serialized RDD partitions |
| `spark.io.compression.codec` | `lz4` | Compression codec for internal data |

### Memory Management

Spark has a unified execution/storage memory region (M) with a reserved storage subregion (R):

```
Memory Region M = Execution + Storage
├── Execution Memory (can evict storage down to threshold R)
└── Storage Memory R (immune to eviction by execution)
```

**Key Memory Configuration:**
| Property | Default | Meaning |
|----------|---------|---------|
| `spark.memory.fraction` | `0.6` | Fraction of heap (minus 300MB) for execution + storage |
| `spark.memory.storageFraction` | `0.5` | Fraction of M reserved for storage (immune to eviction) |
| `spark.memory.offHeap.enabled` | `false` | Use off-heap memory |
| `spark.memory.offHeap.size` | `0` | Off-heap memory size |
| `spark.storage.unrollMemoryThreshold` | `1GB` | Memory before unrolling a block |

**Memory Tuning Best Practices:**
1. Use Kryo serialization to reduce memory footprint
2. Persist data in serialized form (`MEMORY_ONLY_SER`)
3. Prefer arrays of primitives over collection classes
4. Use numeric IDs instead of strings for keys when possible
5. Monitor actual memory usage via the Web UI Storage tab
6. Tune GC settings — full GCs indicate memory pressure

### Configuration

Spark properties can be set via:
1. **SparkConf** programmatically (highest precedence)
2. **Command line** via `--conf key=value`
3. **spark-defaults.conf** file
4. **Properties file** via `--properties-file`

```bash
./bin/spark-submit \
  --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
  --conf spark.sql.shuffle.partitions=500 \
  --conf spark.sql.adaptive.enabled=true \
  myApp.py
```

**Critical Configuration Categories for Data Engineering:**

| Category | Key Properties |
|----------|---------------|
| **Shuffle** | `spark.sql.shuffle.partitions` (200), `spark.reducer.maxSizeInFlight` (48m) |
| **AQE** | `spark.sql.adaptive.enabled` (true), `spark.sql.adaptive.coalescePartitions.enabled` (true) |
| **Join** | `spark.sql.autoBroadcastJoinThreshold` (10MB), `spark.sql.join.preferSortMergeJoin` |
| **Parquet** | `spark.sql.parquet.compression.codec` (snappy), `spark.sql.parquet.filterPushdown` (true) |
| **Serialization** | `spark.serializer` (KryoSerializer), `spark.io.compression.codec` (lz4) |
| **Memory** | `spark.memory.fraction` (0.6), `spark.memory.storageFraction` (0.5) |
| **Partitions** | `spark.sql.files.maxPartitionBytes` (128MB), `spark.default.parallelism` |
| **Arrow** | `spark.sql.execution.arrow.pyspark.enabled` (for toPandas optimization) |

### Structured Streaming

**Note:** Spark Streaming (DStreams) is deprecated. Use Structured Streaming instead.

Structured Streaming provides a scalable, fault-tolerant stream processing engine using the same DataFrame API.

```python
# Read streaming data
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "host:port") \
    .option("subscribe", "topic") \
    .load()

# Process with DataFrame operations
result = df.selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)") \
    .groupBy("key") \
    .count()

# Write output
query = result.writeStream \
    .outputMode("complete") \
    .format("parquet") \
    .option("path", "output/path") \
    .start()

# Wait for termination
query.awaitTermination()
```

**Output Modes:**
| Mode | Meaning | Use Case |
|------|---------|----------|
| `Append` | Only new rows since last trigger | Aggregations where old rows don't change |
| `Complete` | Whole result table sent each trigger | Aggregations where all rows change |
| `Update` | Only rows that changed | More efficient than Complete when possible |

**Watermarking (for event-time processing):**
```python
df.withWatermark("timestamp", "10 hours") \
  .groupBy(window("timestamp", "1 hour"), "key") \
  .count()
```

**Checkpointing:**
```python
query = result.writeStream \
    .outputMode("complete") \
    .format("parquet") \
    .option("checkpointLocation", "hdfs://path/to/checkpoint") \
    .start()
```

### Declarative Pipelines

Declarative Pipelines allow building data pipelines that create and maintain multiple tables using a declarative syntax:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("my_pipeline").getOrCreate()

# Define a pipeline with flows
pipeline = spark.readStream.format("delta") \
    .table("raw_events") \
    .writeStream \
    .format("delta") \
    .table("silver_events")
```

### PySpark with Apache Arrow

Arrow optimization for PySpark enables fast columnar data transfer between JVM and Python:

```python
# Enable Arrow for toPandas()
spark.conf.set("spark.sql.execution.arrow.pyspark.enabled", "true")

# Enable Arrow for Pandas UDFs
spark.conf.set("spark.sql.execution.pythonUDF.arrow.enabled", "true")

# Compression for Arrow IPC data
spark.conf.set("spark.sql.execution.arrow.compression.codec", "zstd")
spark.conf.set("spark.sql.execution.arrow.compression.zstd.level", "3")

# Convert to pandas efficiently
df = spark.read.parquet("data.parquet")
pandas_df = df.toPandas()  # Uses Arrow when enabled
```

### Built-in SQL Functions

Spark SQL provides a rich set of built-in functions:

```python
from pyspark.sql import functions as F
from pyspark.sql.window import Window

# String functions
F.concat(col1, col2)
F.substr(col, start, length)
F.lower(col) / F.upper(col)
F.trim(col) / F.ltrim(col) / F.rtrim(col)
F.regexp_replace(col, pattern, replacement)

# Date/Time functions
F.current_timestamp()
F.date_add(col, n) / F.date_sub(col, n)
F.trunc(col, "MM") / F.trunc(col, "YYYY")
F.months_between(date1, date2)
F.to_date(string, format)
F.date_format(col, format)

# Mathematical functions
F.abs(col) / F.ceil(col) / F.floor(col)
F.round(col, scale) / F.bround(col, scale)
F.sqrt(col) / F.pow(col, n)
F.greatest(col1, col2) / F.least(col1, col2)

# Conditional functions
F.when(col > 10, "high").otherwise("low")
F.coalesce(col1, col2, "default")
F.nanvl(col, replacement)
F.nvl(col, replacement)

# Array functions
F.array(col1, col2)
F.array_contains(col, value)
F.size(col)
F.explode(col)
F.flatten(col)

# Map functions
F.map(col1, col2)
F.map_keys(col) / F.map_values(col)
F.map_concat(map1, map2)

# Window functions
window_spec = Window.partitionBy("category").orderBy("date").rowsBetween(-10, 0)
df.withColumn("running_sum", F.sum("amount").over(window_spec))
df.withColumn("rank", F.rank().over(Window.partitionBy("category").orderBy("amount")))

# Aggregation
F.sum(col) / F.avg(col) / F.count(col) / F.countDistinct(col)
F.min(col) / F.max(col)
F.first(col) / F.last(col)
F.collect_list(col) / F.collect_set(col)
F.approx_count_distinct(col, eps)
F.percentile(col, fraction)

# JSON functions
F.from_json(col, schema)
F.to_json(col)
F.get_json_object(col, path)
F.json_tuple(col, "key1", "key2")
```

### Common Data Engineering Patterns

#### Medallion Architecture (Bronze → Silver → Gold)
```python
# Bronze: Raw ingestion
bronze = spark.read.format("delta").load("bronze_path")
bronze.write.mode("append").format("delta").save("bronze_path")

# Silver: Cleaned and conformed
silver = bronze.filter("col IS NOT NULL") \
    .dropDuplicates(["id"]) \
    .withColumn("processed_at", F.current_timestamp())
silver.write.mode("overwrite").format("delta").save("silver_path")

# Gold: Business-level aggregations
gold = silver.groupBy("category", F.trunc("date", "MM").alias("month")) \
    .agg(
        F.sum("amount").alias("total_amount"),
        F.count("*").alias("transaction_count"),
        F.avg("amount").alias("avg_amount")
    )
gold.write.mode("overwrite").format("delta").save("gold_path")
```

#### Handling Small Files
```python
# Coalesce output files
df.coalesce(10).write.mode("overwrite").parquet("output")

# Or use repartition for parallel writes
df.repartition(100).write.mode("overwrite").parquet("output")

# Optimize write for large tables (Delta)
spark.conf.set("spark.sql.parquet.vorder.enabled", "true")
spark.conf.set("spark.microsoft.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.microsoft.delta.optimizeWrite.binSize", "1073741824")  # 1GB
```

#### Handling Data Skew
```python
# Salting technique for skewed joins
import random

def add_salt(key):
    return (key, random.randint(0, 9))

# Add random salt to skewed key
salted_df = df.withColumn("salted_key", F.concat(F.col("key"), F.lit("_"), F.floor(F.rand() * 10)))

# Broadcast the smaller table
result = salted_df.join(broadcast(small_df), salted_df["key"] == small_df["key"]) \
    .groupBy("key", "other_col") \
    .agg(F.sum("amount"))
```

#### Schema Enforcement & Evolution
```python
# Define explicit schema for data quality
from pyspark.sql.types import StructType, StructField, StringType, LongType, DoubleType, TimestampType

schema = StructType([
    StructField("id", LongType(), False),
    StructField("name", StringType(), True),
    StructField("amount", DoubleType(), True),
    StructField("created_at", TimestampType(), True)
])

df = spark.read.schema(schema).csv("data.csv")
# Missing columns become null, type mismatches cause errors
```

#### Partition Pruning Best Practices
```python
# Write with meaningful partitions
df.write.partitionBy("date", "region").parquet("warehouse/events")

# Read with partition filters (automatic pruning)
df = spark.read.parquet("warehouse/events").filter(
    (F.col("date") >= "2024-01-01") & (F.col("region") == "US")
)
# Only reads: warehouse/events/date=2024-01-01/region=US/...

# SQL equivalent — partition columns are automatically pruned
spark.sql("SELECT * FROM events WHERE date >= '2024-01-01' AND region = 'US'")
```

## Code Examples

### Complete ETL Pipeline Example
```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

# Initialize
spark = SparkSession.builder \
    .appName("ETL Pipeline") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "500") \
    .getOrCreate()

# 1. Read source data
raw_df = spark.read.format("parquet").load("s3a://bucket/raw-data/")

# 2. Validate schema
from pyspark.sql.types import StructType, StructField, StringType, LongType, DoubleType, TimestampType
expected_schema = StructType([
    StructField("id", LongType(), False),
    StructField("customer_id", LongType(), False),
    StructField("amount", DoubleType(), True),
    StructField("currency", StringType(), True),
    StructField("timestamp", TimestampType(), True),
])
validated_df = spark.read.schema(expected_schema).parquet("s3a://bucket/raw-data/")

# 3. Transform — clean and enrich
cleaned_df = validated_df \
    .filter(F.col("amount") > 0) \
    .filter(F.col("currency").isin(["USD", "EUR", "GBP"])) \
    .withColumn("amount_usd", F.when(F.col("currency") == "USD", F.col("amount"))
                .when(F.col("currency") == "EUR", F.col("amount") * 1.1)
                .otherwise(F.col("amount") * 1.27)) \
    .withColumn("date", F.to_date(F.col("timestamp"))) \
    .withColumn("month", F.trunc(F.col("timestamp"), "MM"))

# 4. Write to Bronze (append)
cleaned_df.write.mode("append") \
    .partitionBy("date") \
    .format("delta") \
    .save("s3a://bucket/bronze/transactions")

# 5. Silver — deduplicate and aggregate daily
daily_agg = cleaned_df.groupBy("customer_id", "date") \
    .agg(
        F.sum("amount_usd").alias("daily_total"),
        F.count("*").alias("tx_count"),
        F.avg("amount_usd").alias("avg_tx_amount")
    )

daily_agg.write.mode("overwrite") \
    .format("delta") \
    .saveAsTable("silver.daily_transactions")

# 6. Gold — customer lifetime value
window_spec = Window.partitionBy("customer_id").orderBy("date")
ltv = daily_agg.withColumn("cumulative_total", F.sum("daily_total").over(window_spec)) \
    .withColumn("customer_rank", F.rank().over(window_spec))

ltv.write.mode("overwrite") \
    .format("delta") \
    .saveAsTable("gold.customer_ltv")

# 7. Optimize tables (VACUUM and OPTIMIZE for Delta)
spark.sql("OPTIMIZE gold.customer_ltv ZORDER BY (customer_id)")
spark.sql("VACUUM gold.customer_ltv RETAIN 168 HOURS")
```

### Streaming ETL Example
```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("Streaming ETL").getOrCreate()

# Read streaming data from Kafka
stream_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "broker1:9092,broker2:9092") \
    .option("subscribe", "transactions") \
    .option("startingOffsets", "earliest") \
    .load()

# Parse and transform
parsed = stream_df.selectExpr("CAST(value AS STRING)") \
    .select(F.from_json(F.col("value"), schema).alias("data")) \
    .select("data.*")

# Aggregation with watermark for event-time processing
result = parsed \
    .withWatermark("timestamp", "30 minutes") \
    .groupBy(
        F.window("timestamp", "5 minutes"),
        F.col("customer_id")
    ) \
    .agg(
        F.sum("amount").alias("window_total"),
        F.count("*").alias("window_count")
    )

# Write to Delta table
query = result.writeStream \
    .format("delta") \
    .outputMode("complete") \
    .option("checkpointLocation", "s3a://bucket/checkpoints/transactions/") \
    .trigger(processingTime="1 minute") \
    .start("s3a://bucket/gold/streaming_aggregates/")

query.awaitTermination()
```

### JDBC Read/Write Pattern
```python
# Efficient parallel JDBC read with partitioning
df = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://host:5432/db") \
    .option("dbtable", "(SELECT * FROM large_table WHERE id > 0) AS t") \
    .option("user", "reader") \
    .option("password", "secret") \
    .option("driver", "org.postgresql.Driver") \
    .option("numPartitions", "20") \
    .option("partitionColumn", "id") \
    .option("lowerBound", "1") \
    .option("upperBound", "10000000") \
    .option("fetchsize", "5000") \
    .load()

# Write back to JDBC
df.write.format("jdbc") \
    .option("url", "jdbc:postgresql://host:5432/db") \
    .option("dbtable", "target_table") \
    .option("user", "writer") \
    .option("password", "secret") \
    .option("driver", "org.postgresql.Driver") \
    .option("batchsize", "1000") \
    .option("isolationLevel", "NONE") \
    .mode("append") \
    .save()
```

### Performance-Optimized Query Pattern
```python
from pyspark.sql import functions as F

# 1. Cache frequently accessed small tables
spark.catalog.cacheTable("dim_lookup")

# 2. Use broadcast join for small table
result = large_df.join(
    F.broadcast(spark.table("dim_lookup")),
    "key_id"
)

# 3. Filter early to reduce data volume
result = result.filter(
    (F.col("date") >= "2024-01-01") &
    (F.col("status") == "active")
)

# 4. Use predicate pushdown (automatic for Parquet/ORC)
result = result.select(
    "key_id", "value", "category"  # Only select needed columns
)

# 5. Repartition for downstream operations
result.repartition(200, "category") \
    .write.mode("overwrite") \
    .partitionBy("category") \
    .parquet("output/")
```

## Common Patterns & Best Practices

### File Format Selection
| Format | Best For | Compression | Schema Evolution | Partition Discovery |
|--------|----------|-------------|-----------------|---------------------|
| **Parquet** | General purpose, analytics | snappy, zstd, gzip | Yes (mergeSchema) | Yes |
| **ORC** | Hive ecosystems, big data | zstd, snappy | Yes (mergeSchema) | Yes |
| **Avro** | Schema evolution, row-based | snappy, deflate | Yes (native) | No |
| **JSON** | Semi-structured, logs | gzip, none | No | Yes |
| **CSV** | Interoperability, human-readable | none | No | Yes |

### Partitioning Strategy
1. **Use partitioning** for low-to-medium cardinality columns (date, region, country)
2. **Avoid partitioning** high-cardinality columns (user_id, transaction_id)
3. **Target 100MB-1GB per partition** when reading
4. **Combine partitioning + bucketing** for join-heavy workloads
5. **Use `MSCK REPAIR TABLE`** to sync metastore partitions

### Performance Checklist
- [ ] Use Parquet/ORC as default format
- [ ] Enable Kryo serialization for custom objects
- [ ] Set appropriate `spark.sql.shuffle.partitions` (not just default 200)
- [ ] Enable AQE (enabled by default since 3.2)
- [ ] Use broadcast joins for small tables (< 10MB)
- [ ] Partition data on low-cardinality columns
- [ ] Cache frequently accessed small tables
- [ ] Use predicate pushdown (automatic for Parquet/ORC)
- [ ] Select only needed columns (avoid `SELECT *`)
- [ ] Monitor skew and handle with AQE or salting
- [ ] Use Arrow optimization for PySpark ↔ Pandas transfers
- [ ] Tune compression codec (zstd for best ratio, snappy for speed)

### Data Quality Patterns
```python
# Null handling
df.na.drop()                    # Drop rows with any null
df.na.drop(subset=["col1"])     # Drop rows with null in specific columns
df.na.fill(0)                   # Fill all nulls with 0
df.na.fill({"col1": 0, "col2": "unknown"})  # Fill specific columns

# Duplicate handling
df.dropDuplicates()             # Drop all duplicate rows
df.dropDuplicates(["key"])      # Drop duplicates based on specific columns

# Validation
def validate(df, schema):
    """Validate that DataFrame matches expected schema."""
    expected = set(schema.fieldNames())
    actual = set(df.columns)
    missing = expected - actual
    extra = actual - expected
    if missing:
        raise ValueError(f"Missing columns: {missing}")
    if extra:
        raise ValueError(f"Extra columns: {extra}")
    return df
```

## Common Pitfalls & Troubleshooting

1. **Too many small partitions** — AQE coalesces automatically, or set `spark.sql.adaptive.coalescePartitions.enabled=true`
2. **Data skew causing stragglers** — Enable AQE skew join handling, or use salting technique
3. **OOM during joins** — Increase `spark.sql.shuffle.partitions`, use broadcast join, or enable AQE
4. **Slow toPandas()** — Enable Arrow: `spark.sql.execution.arrow.pyspark.enabled=true`
5. **Schema mismatch errors** — Use explicit schema instead of `inferSchema`, or enable `mergeSchema`
6. **Too many output files** — Use `coalesce()` or `repartition()` before writing
7. **GC pressure** — Use Kryo serialization, `MEMORY_ONLY_SER` storage, or off-heap memory
8. **Partition explosion** — Avoid high-cardinality partition columns; use bucketing instead
9. **Broadcast join timeout** — Increase `spark.sql.broadcastTimeout` or reduce table size
10. **Slow file listing on S3** — Enable parallel partition discovery: `spark.sql.sources.parallelPartitionDiscovery.threshold`

## Learning Path

### Beginner
1. Understand SparkSession and DataFrame basics
2. Learn read/write operations for Parquet, CSV, JSON
3. Practice basic transformations (select, filter, groupBy, join)
4. Understand save modes (overwrite, append, ignore)
5. Learn partitioning basics

### Intermediate
1. Master partitioning strategies and bucketing
2. Understand AQE and when to tune partitions
3. Learn broadcast joins and join hints
4. Implement caching and checkpointing
5. Work with JDBC sources and parallel reads
6. Handle schema evolution and validation

### Advanced
1. Optimize performance with Kryo, Arrow, and memory tuning
2. Design medallion architecture pipelines
3. Implement streaming ETL with watermarks and checkpoints
4. Handle data skew with AQE and salting
5. Design storage partition joins with bucketed tables
6. Implement declarative pipelines
7. Optimize for cloud storage (S3, ADLS) with parallel listing

## Related Resources
- [Apache Spark Documentation](https://spark.apache.org/docs/latest/)
- [Spark SQL Programming Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [Spark SQL Data Sources](https://spark.apache.org/docs/latest/sql-data-sources.html)
- [Spark SQL Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)
- [Structured Streaming Programming Guide](https://spark.apache.org/docs/latest/streaming-programming-guide.html)
- [Spark Tuning Guide](https://spark.apache.org/docs/latest/tuning.html)
- [Spark Configuration Reference](https://spark.apache.org/docs/latest/configuration.html)
- [PySpark API Reference](https://spark.apache.org/docs/latest/api/python/index.html)
- [SQL Built-in Functions Reference](https://spark.apache.org/docs/latest/api/sql/index.html)
- [Declarative Pipelines Guide](https://spark.apache.org/docs/latest/declarative-pipelines-programming-guide.html)

## Usage Instructions
When a user asks about Apache Spark for data engineering, provide expert-level guidance covering:
- DataFrame/SQL operations and transformations
- Data source selection and read/write patterns
- Partitioning, bucketing, and file format decisions
- Performance optimization (AQE, joins, caching, serialization)
- Memory management and configuration tuning
- Streaming with Structured Streaming
- PySpark/Scala/Java code examples
- Data quality and schema management
- Common patterns (medallion architecture, ETL pipelines)

Always provide code examples in the user's preferred language (Python/PySpark, Scala, or Java), and recommend the best approach based on data size, source format, and processing requirements. Reference official Spark documentation for configuration details and version-specific features.
