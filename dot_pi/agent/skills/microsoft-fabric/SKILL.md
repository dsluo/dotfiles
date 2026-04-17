---
name: microsoft-fabric
description: Microsoft Fabric expert for architecture decisions, workload selection (Lakehouse, Warehouse, Data Factory, Data Engineering, Data Science, Power BI, Real-Time Intelligence), medallion architecture, OneLake shortcuts, mirroring, Direct Lake mode, Activator rules, capacity planning, governance with Purview, and Fabric REST APIs. Use when designing, building, or troubleshooting Microsoft Fabric solutions.
---

# Microsoft Fabric Expert Skill

## Description
This skill enables the assistant to act as a Microsoft Fabric expert, providing comprehensive guidance on Microsoft Fabric's architecture, workloads, development patterns, administration, governance, and best practices. Microsoft Fabric is an all-in-one analytics platform that unifies data engineering, data science, real-time intelligence, data warehousing, and business intelligence into a single SaaS solution.

## Version
1.0.0

## Topics
- Microsoft Fabric Architecture & Overview
- OneLake & Delta Lake Storage
- Lakehouse & Warehouse
- Data Factory & Dataflows Gen2
- Real-Time Intelligence (Eventhouse, Eventstream, Activator)
- Power BI & Semantic Models (Direct Lake)
- Data Engineering with Spark & Notebooks
- Data Science & Machine Learning
- Mirroring & Data Sharing
- Governance, Security & Administration
- Licensing & Capacities (F SKU, P SKU)
- Copilot & AI Features
- Data Agents & Fabric IQ
- Extensibility & Workload Development
- Medallion Architecture
- Enterprise BI Solution Design

## Knowledge Base

### What is Microsoft Fabric?
Microsoft Fabric is an end-to-end, all-in-one analytics solution for enterprises. It's a Software-as-a-Service (SaaS) platform that unifies what were previously separate products into a single, cohesive experience. Fabric covers everything from data movement to data science, real-time analytics, and business intelligence.

### Core Fabric Workloads

1. **Power BI** - Interactive charts, dashboards, and reports. Supports Import, DirectQuery, and Direct Lake modes.
2. **Databases** - Developer-friendly transactional databases (like Azure SQL Database) with mirroring capability to bring data into OneLake.
3. **Data Factory** - Modern ETL/orchestration with 200+ native connectors, pipelines, and Dataflows Gen2 (Power Query-based).
4. **Data Engineering** - Apache Spark-based notebooks, Spark jobs, user data functions, and lakehouse management.
5. **Data Science** - Machine learning model building, training, and operationalization with MLflow integration and Azure Machine Learning connectivity.
6. **Data Warehouse** - Industry-leading SQL performance with ANSI SQL, ACID transactions, stored procedures, and Delta Lake storage.
7. **Real-Time Intelligence** - Ingest, analyze, and act on streaming data (IoT, logs, clickstreams) using Eventhouse (KQL), Eventstream, and Activator.
8. **Fabric IQ** (preview) - Unifies business semantics across data, models, and systems with ontology, plans, Fabric Graph, data agents, and semantic models.
9. **Industry Solutions** - Pre-built industry-specific data solutions.

### OneLake - The Data Foundation
- OneLake is the unified, logical data lake for the entire organization ("OneDrive for data")
- Every Fabric tenant automatically gets one OneLake - you cannot create multiple or delete it
- Built on Azure Data Lake Storage Gen2 (ADLS Gen2) APIs
- All tabular data stored in **Delta Parquet format** by default
- Organized by workspaces (each workspace = a container)
- Supports **shortcuts** for zero-copy access to data in other OneLake locations, Azure ADLS Gen2, or Amazon S3
- Supports **V-Order** write-time optimization for faster reads

### Lakehouse vs. Warehouse Decision Guide

| Aspect | Lakehouse | Warehouse |
|--------|-----------|-----------|
| Primary tool | Apache Spark (Python, Scala, SQL, R) | T-SQL |
| Data types | Structured and unstructured | Structured only |
| Multi-table transactions | No | Yes |
| SQL endpoint | Read-only SQL analytics endpoint | Full T-SQL with ACID |
| Best for | Data engineering, data science, medallion | BI reporting, dimensional modeling |
| Ingestion | Notebooks, pipelines, shortcuts | T-SQL (COPY INTO, INSERT, CTAS), pipelines |

### Medallion Architecture
A three-layer data organization pattern:
1. **Bronze** - Raw data in original format; use shortcuts when possible instead of copying
2. **Silver** - Cleaned, conformed data stored as Delta tables
3. **Gold** - Refined, business-level data for reporting (can be Lakehouse with SQL endpoint or Warehouse)

### Real-Time Intelligence Stack
1. **Eventstream** - Ingests streaming data from Event Hubs, Kafka, IoT Hub, REST APIs; transforms and routes data
2. **Eventhouse** - Stores and analyzes high-volume event/time-series data using KQL (Kusto Query Language)
3. **KQL Database** - Holds data for KQL queries within an Eventhouse
4. **KQL Queryset** - Save, share, and manage KQL queries
5. **Real-Time Dashboard** - Live visualizations of streaming data
6. **Activator** - No-code event detection engine that triggers actions when patterns are detected

### Activator Core Concepts
- **Events** - Individual records from eventstreams
- **Objects** - Logical entities identified by a key (e.g., device_id)
- **Properties** - Fields/attributes to monitor on objects
- **Rules** - Conditions evaluated continuously (simple thresholds, BECOMES, INCREASES, DECREASES, EXIT RANGE, heartbeat)
- **Actions** - What happens when a rule triggers: Power Automate flows, Teams/email notifications, Fabric pipelines, notebooks, spark jobs

### Data Flow Patterns
1. **Ingest** → Data Factory pipelines, Eventstream, Mirroring, Copy jobs
2. **Store** → OneLake (Lakehouse, Warehouse, Eventhouse, mirrored databases)
3. **Process** → Spark notebooks, SQL scripts, Dataflow Gen2, KQL queries
4. **Enrich** → Data Science (ML models), Azure Machine Learning
5. **Serve** → Power BI reports, Direct Lake, Data Agents, Excel

### Direct Lake Mode
- Power BI queries Delta tables in OneLake directly
- Combines Import mode performance with DirectQuery freshness
- No data duplication; uses lake-native architecture
- Requires V-Order optimization and proper partitioning for best performance
- Recommended for large-scale analytics on Fabric-managed data

### Mirroring
- Near real-time replication of operational data into OneLake without ETL
- Supports: Azure SQL Database, Azure Cosmos DB, Azure Databricks, Snowflake
- Creates a SQL analytics endpoint automatically
- Does NOT affect transactional workload performance or RU consumption
- Data stored in Delta Parquet format in OneLake

### Licensing & Capacities

**Per-User Licenses:**
- Fabric Free - Limited capabilities
- Power BI Pro - $10/user/month
- Power BI Premium Per User (PPU) - $20/user/month

**Capacity SKUs (Azure F-series):**
| SKU | Capacity Units | v-cores |
|-----|---------------|---------|
| F2 | 2 | 0.25 |
| F4 | 4 | 0.5 |
| F8 | 8 | 1 |
| F16 | 16 | 2 |
| F32 | 32 | 4 |
| F64 | 64 | 8 |
| F128 | 128 | 16 |
| F256 | 256 | 32 |
| F512 | 512 | 64 |
| F1024 | 1024 | 128 |
| F2048 | 2048 | 256 |

**Key Points:**
- F SKUs: Billed per second via Azure, support pause/resume/resize
- P SKUs: Monthly billing via M365 EA, no pause/resume
- F64+ allows users with free license to view Power BI content
- Copilot requires F2/P1 or higher
- Trial capacity provides 64 CUs

### Governance & Security
- **Microsoft Purview** built-in for data governance
- **OneLake Catalog** - unified hub for discovery, exploration, and governance
- **Sensitivity labels** - inherited across Fabric items
- **Workspace roles** - Admin, Member, Contributor, Member, Viewer, Contributor
- **Row-level security** on semantic models
- **Managed Private Endpoints** (F SKU only)
- **Customer-managed keys** (F SKU only)
- **Auditing** - comprehensive activity logs
- **Data Loss Prevention** (requires additional Purview licensing)

### Copilot in Fabric
- AI-powered assistance across workloads
- **Data Factory**: Generate pipelines, dataflows, expressions via natural language
- **Power BI**: Generate reports, DAX, insights from data
- **Data Engineering**: Explain queries, generate transformations
- Requires: F2/P1+ capacity, Copilot enabled in tenant
- Not supported on trial SKUs

### Data Agents
- AI-powered conversational data access
- Can be consumed in Microsoft 365 Copilot and Copilot Studio
- Connect to warehouses, lakehouses, semantic models, KQL databases, ontologies
- Requires F2+ capacity with Copilot capacity designation

### Fabric REST APIs
- Full programmatic access via REST APIs
- Fabric CLI available
- ARM APIs and Terraform support (F SKU only)
- Key API categories: Capacities, Workspaces, Items, Datasets, Pipelines, Notebooks

## Code Examples

### Reading/Writing Delta Tables in Spark
```python
# Read a Delta table
df = spark.read.format("delta").load("Tables/my_table")

# Write a Delta table
df.write.mode("overwrite").format("delta").save("Tables/my_table")

# With V-Order optimization (best practice)
spark.conf.set("spark.sql.parquet.vorder.enabled", "true")
spark.conf.set("spark.microsoft.delta.optimizeWrite.enabled", "true")
spark.conf.set("spark.microsoft.delta.optimizeWrite.binSize", "1073741824")
df.write.mode("overwrite").format("delta").save("Tables/my_table")
```

### Medallion Architecture Pattern
```python
# Bronze layer - raw data
spark.read.format("delta").load("Tables/bronze_raw")

# Silver layer - cleaned
cleaned = bronze.filter("column IS NOT NULL").dropDuplicates()
cleaned.write.mode("overwrite").format("delta").save("Tables/silver_cleaned")

# Gold layer - aggregated for BI
gold = silver.groupBy("category").agg({"amount": "sum"})
gold.write.mode("overwrite").format("delta").save("Tables/gold_summary")
```

### OneLake Shortcut Creation (Spark)
```python
# Create a shortcut to external data
spark.sql("""
CREATE TABLE external_data
USING delta
LOCATION 'abfss://container@storage.dfs.core.windows.net/path'
""")
```

### KQL for Eventhouse
```kql
// Query streaming events
events
| where Timestamp > ago(1h)
| summarize count() by bin(Timestamp, 5m), DeviceId
| render timechart
```

### Power BI Direct Lake Connection
- In Power BI Desktop: Connect to Fabric Warehouse/Lakehouse
- Choose "Direct Lake" query mode in semantic model
- No import refresh needed; queries OneLake Delta tables directly

## Common Patterns & Best Practices

### Enterprise BI Architecture
1. Ingest with Data Factory pipelines or Mirroring
2. Store in OneLake (Lakehouse for engineering, Warehouse for BI)
3. Apply medallion architecture (bronze → silver → gold)
4. Create semantic models in Direct Lake mode
5. Build Power BI reports on semantic models
6. Govern with Purview and OneLake Catalog

### Real-Time Monitoring
1. Ingest events via Eventstream from Event Hubs/IoT Hub
2. Route to Eventhouse KQL database
3. Create KQL Querysets for recurring analysis
4. Build Real-Time Dashboards for visualization
5. Set up Activator rules for automated responses
6. Trigger Power Automate flows or Fabric pipelines on alerts

### Data Science MLOps
1. Ingest data into Lakehouse via Spark
2. Explore and clean with notebooks + Data Wrangler
3. Train models with Azure ML integration + MLflow tracking
4. Register models in Fabric/Azure ML model registry
5. Score in batch or real-time via notebooks
6. Save predictions to Lakehouse Delta tables
7. Visualize results in Power BI via Direct Lake

### Capacity Planning
- Start with F64 for moderate workloads
- Monitor with Fabric Metrics App
- Use pause/resume for cost optimization (F SKU)
- Consider chargeback/showback for multi-department
- Scale up when consistent utilization exceeds ~80%
- Split workloads across multiple capacities for isolation

## Common Pitfalls & Troubleshooting

1. **Direct Lake performance issues**: Ensure V-Order optimization, proper partitioning, and star schema design
2. **Spark session cold starts**: Live Pool starts in seconds; subsequent cells are instant while session active
3. **OneLake shortcut failures**: Verify permissions and network connectivity to source
4. **Activator latency**: Optimize lookback periods and rule complexity
5. **Capacity throttling**: Monitor CU usage; scale up or optimize workloads
6. **Copilot errors**: Check tenant settings, capacity SKU (F2/P1+), and region availability
7. **Delta table conflicts**: Use proper write modes; be aware Lakehouse doesn't support multi-table transactions

## Learning Path

### Beginner
1. Understand Fabric overview and architecture
2. Create workspaces and explore the Fabric portal
3. Build a simple Lakehouse and load data
4. Create a Power BI report with Direct Lake
5. Understand OneLake and shortcuts

### Intermediate
1. Build medallion architecture with bronze/silver/gold layers
2. Create Data Factory pipelines for ETL
3. Write Spark notebooks for data transformation
4. Set up Real-Time Intelligence with Eventhouse
5. Configure Activator for event-driven automation
6. Implement governance with Purview

### Advanced
1. Design enterprise-scale BI solutions
2. Implement mirroring for HTAP scenarios
3. Build Data Science workflows with MLflow
4. Optimize capacity planning and cost management
5. Create custom workloads with Extensibility Toolkit
6. Implement Data Agents and Fabric IQ
7. Design multi-workspace governance strategies

## Related Resources
- [Microsoft Fabric Documentation](https://learn.microsoft.com/fabric/)
- [Fabric Architecture Overview](https://learn.microsoft.com/fabric/fundamentals/microsoft-fabric-overview)
- [OneLake Overview](https://learn.microsoft.com/fabric/onelake/onelake-overview)
- [Fabric Licensing](https://learn.microsoft.com/fabric/enterprise/licenses)
- [Governance Overview](https://learn.microsoft.com/fabric/governance/governance-compliance-overview)
- [Fabric REST APIs](https://learn.microsoft.com/rest/api/fabric/)
- [Fabric CLI](https://learn.microsoft.com/rest/api/fabric/articles/fabric-command-line-interface)
- [Fabric Admin Center](https://learn.microsoft.com/fabric/admin/admin-overview)
- [Industry Solutions](https://learn.microsoft.com/industry/industry-data-solutions-fabric)
- [Extensibility Toolkit](https://learn.microsoft.com/fabric/extensibility-toolkit/)

## Usage Instructions
When a user asks about Microsoft Fabric, provide expert-level guidance covering:
- Architecture decisions and workload selection
- Implementation patterns and best practices
- Code examples for Spark, KQL, T-SQL, and Power BI
- Administration and governance guidance
- Licensing and capacity planning advice
- Troubleshooting and optimization tips

Always reference official Microsoft Learn documentation when providing specific guidance, and recommend the appropriate workload based on the user's scenario and expertise level.
