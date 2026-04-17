---
name: fabric-cicd
description: fabric-cicd expert for Microsoft Fabric CI/CD automation. Covers the fabric-cicd Python library for code-first deployment of Fabric workspace items across environments. Supports FabricWorkspace object, publish/unpublish operations, parameterization (find_replace, key_value_replace, spark_pool, semantic_model_binding), configuration-based deployment (config.yml), authentication patterns (Azure CLI, PowerShell, Managed Identity, SPN, Fabric Notebook), feature flags, selective deployment, Git flow, and all 24+ supported item types. Use when deploying, automating, or troubleshooting Microsoft Fabric CI/CD workflows.
---

# fabric-cicd Expert Skill

## Description
This skill enables the assistant to act as an expert for **fabric-cicd** — the open-source Python library by Microsoft for code-first Continuous Integration / Continuous Deployment (CI/CD) of Microsoft Fabric workspace items. It provides an abstraction over the Fabric REST APIs, enabling teams to deploy source-controlled Fabric items across environments without manually calling API endpoints.

**Version**: 0.3.1 (latest, March 2026)
**Repository**: https://github.com/microsoft/fabric-cicd
**Documentation**: https://microsoft.github.io/fabric-cicd/
**PyPI**: https://pypi.org/project/fabric-cicd
**License**: MIT
**Python**: 3.9–3.13

## Topics
- Installation & Setup
- Core Concepts & Architecture
- FabricWorkspace Object
- Authentication Patterns
- Parameterization (find_replace, key_value_replace, spark_pool, semantic_model_binding)
- Configuration-Based Deployment (config.yml)
- Feature Flags & Optional Features
- Selective Deployment
- Item Type Support & Limitations
- Git Flow & ALM Patterns
- CI/CD Pipeline Integration (Azure DevOps, GitHub Actions)
- Troubleshooting & Debugging

## Knowledge Base

### What is fabric-cicd?
fabric-cicd is a Python library that automates deployment of Microsoft Fabric workspace items from source control to target workspaces. It supports:
- **Full deployment every time** — does not consider commit diffs; each deployment is a full sync
- **Deploys into the tenant of the executing identity**
- **Only items with Source Control and Public Create/Update APIs** are supported
- Works seamlessly with **Azure DevOps** and **GitHub** pipelines
- Integrates with **Git-connected Fabric workspaces** via the ALM tool

### Installation
```bash
pip install fabric-cicd
```

### Core Deployment Pattern

**Code-first approach (FabricWorkspace object):**
```python
from azure.identity import AzureCliCredential
from fabric_cicd import FabricWorkspace, publish_all_items, unpublish_all_orphan_items

# Authenticate
token_credential = AzureCliCredential()

# Define deployment target
target_workspace = FabricWorkspace(
    workspace_id="your-workspace-id",
    environment="your-target-environment",  # e.g., "DEV", "PPE", "PROD"
    repository_directory="path/to/repo/dir",
    item_type_in_scope=["Notebook", "DataPipeline", "Environment"],
    token_credential=token_credential,
)

# Deploy
publish_all_items(target_workspace)
unpublish_all_orphan_items(target_workspace)
```

**Configuration-based approach (config.yml):**
```python
from fabric_cicd import deploy_with_config

deploy_with_config(
    config_file_path="path/to/config.yml",
    environment="dev"
)
```

### Directory Structure
fabric-cicd expects a directory structure matching what Fabric Source Control exports:
```
/<repository-directory>/
    /<item-name>.<item-type>/
        ...  (item definition files)
    /<workspace-subfolder>/
        /<item-name>.<item-type>/
            ...
    /parameter.yml              # (optional) parameterization rules
    /config.yml                 # (optional) configuration-based deployment
```

### Git Flow (Hero Scenario)
- `Deployed` branches are **not** connected to workspaces via Git Sync
- `Feature` branches **are** connected to workspaces via Git Sync
- `Deployed` workspaces are **only** updated through script-based deployments (fabric-cicd)
- Feature branches are created from default, merged back into Deployed, and cherry-picked into upper Deployed branches
- Each deployment is a **full deployment** — no commit diff consideration

### Authentication Patterns

> **⚠️ DEPRECATION**: `DefaultAzureCredential` is deprecated. Always provide an explicit `token_credential`.

**1. Azure CLI Credential (local dev / Azure DevOps):**
```python
from azure.identity import AzureCliCredential
token_credential = AzureCliCredential()
```
Requires `az login` prior to execution. Works with any identity (UPN, SPN, Managed Identity).

**2. Azure PowerShell Credential:**
```python
from azure.identity import AzurePowerShellCredential
token_credential = AzurePowerShellCredential()
```
Requires `Connect-AzAccount` prior to execution.

**3. Managed Identity (self-hosted agents):**
```python
from azure.identity import ManagedIdentityCredential
token_credential = ManagedIdentityCredential()
```
For Azure DevOps self-hosted agents or GitHub Actions on Azure VMs with system-assigned managed identity.

**4. Service Principal (CI/CD):**
```python
from azure.identity import ClientSecretCredential
token_credential = ClientSecretCredential(
    tenant_id="your-tenant-id",
    client_id="your-client-id",
    client_secret="your-client-secret"  # Use Azure Key Vault in production
)
```

**5. Fabric Notebook (automatic):**
When running inside a Fabric Notebook, authentication is automatic — no `token_credential` needed:
```python
target_workspace = FabricWorkspace(
    workspace_id="your-workspace-id",
    environment="your-environment",
    repository_directory="path/to/repo",
    item_type_in_scope=["Notebook", "DataPipeline"],
    # No token_credential needed — auto-authenticated
)
```

### Parameterization

Parameterization replaces environment-specific values (workspace IDs, lakehouse IDs, connection IDs, etc.) when deploying across environments. The `environment` parameter passed to `FabricWorkspace` determines which environment's values to use from `parameter.yml`.

**parameter.yml location**: Root of `repository_directory`

#### 1. find_replace — Generic String Replacement
Replaces literal strings or regex patterns in files:
```yaml
find_replace:
  - find_value: "dev-lakehouse-guid"
    replace_value:
      PPE: "ppe-lakehouse-guid"
      PROD: "prod-lakehouse-guid"
    item_type: "Notebook"           # optional: filter by item type
    item_name: "My Notebook"        # optional: filter by item name
    file_path: "/notebook-content.py"  # optional: filter by file path
    is_regex: "true"                # optional: treat find_value as regex
```

**Regex find_value example** (for notebook lakehouse metadata):
```yaml
find_replace:
  - find_value: '#\s*META\s+"default_lakehouse":\s*"([0-9a-fA-F]{8}-...)"'
    replace_value:
      PPE: "$items.Lakehouse.Example_LH.$id"
      PROD: "$items.Lakehouse.Example_LH.$id"
    is_regex: "true"
    item_type: "Notebook"
```

#### 2. key_value_replace — JSONPath-Based Replacement
Replaces values by key in JSON/YAML files:
```yaml
key_value_replace:
  - find_key: $.properties.activities[?(@.name=="Copy Data")].typeProperties.source.datasetSettings.externalReferences.connection
    replace_value:
      PPE: "ppe-connection-guid"
      PROD: "prod-connection-guid"
    item_type: "DataPipeline"
```

**Schedule enable/disable example:**
```yaml
key_value_replace:
  - find_key: $.schedules[?(@.jobType=="Execute")].enabled
    replace_value:
      PPE: false
      PROD: true
    file_path: "**/.schedules"
```

#### 3. spark_pool — Spark Pool Parameterization
For Environment items attached to custom spark pools:
```yaml
spark_pool:
  - instance_pool_id: "dev-pool-guid"
    replace_value:
      PPE:
        type: "Capacity"
        name: "CapacityPool_Medium"
      PROD:
        type: "Capacity"
        name: "CapacityPool_Large"
    item_name: "MyEnvironment"  # optional filter
```

#### 4. semantic_model_binding — Auto-Bind Semantic Models
Automatically connects semantic models to data source connections after deployment:
```yaml
semantic_model_binding:
  default:
    connection_id:
      PPE: "ppe-connection-guid"
      PROD: "prod-connection-guid"
  models:
    - semantic_model_name: "MyModel"
      connection_id:
        PPE: "ppe-specific-connection-guid"
        PROD: "prod-specific-connection-guid"
```
**Note**: Only one connection binding per Semantic Model is supported.

#### Dynamic Replacement Variables
Use these in `replace_value` to reference deployed item metadata:
| Variable | Description | Example |
|----------|-------------|---------|
| `$workspace.$id` | Target workspace ID | `$workspace.$id` |
| `$workspace.<name>` | Workspace ID by name | `$workspace.TestWorkspace` |
| `$workspace.<name>.$items.<type>.<name>.$<attr>` | Item attribute in named workspace | `$workspace.TestWorkspace.$items.Lakehouse.Example_LH.$id` |
| `$items.<type>.<name>.$id` | Item ID of deployed item | `$items.Notebook.MyNotebook.$id` |
| `$items.<type>.<name>.$sqlendpoint` | SQL endpoint | `$items.Lakehouse.MyLakehouse.$sqlendpoint` |
| `$items.<type>.<name>.$sqlendpointid` | SQL endpoint ID | `$items.Lakehouse.MyLakehouse.$sqlendpointid` |
| `$items.<type>.<name>.$queryserviceuri` | Query service URI (Eventhouse) | `$items.Eventhouse.MyEventhouse.$queryserviceuri` |

**Important**: Dynamic replacement only works for items that exist in the `repository_directory`.

#### _ALL_ Environment Key
Use `_ALL_` (case-insensitive) to apply the same replacement across all environments:
```yaml
find_replace:
  - find_value: "dev-workspace-id"
    replace_value:
      _ALL_: "$workspace.$id"  # Same value for all environments
```

#### File Path Filters
Support absolute, relative, and wildcard paths:
```yaml
file_path:
  - "/My Notebook.Notebook/notebook-content.py"
  - "**/notebook-content.py"  # wildcard: all notebook-content.py files
```

### Configuration-Based Deployment (config.yml)

An alternative to the code-first approach. All deployment settings are in a YAML file:

```yaml
core:
  workspace_id:
    dev: "dev-workspace-guid"
    prod: "prod-workspace-guid"
  repository_directory: "."
  item_types_in_scope:
    - Notebook
    - DataPipeline
    - Environment
  parameter: "parameter.yml"

publish:
  exclude_regex: "^DONT_DEPLOY.*"
  skip:
    dev: true
    prod: false

unpublish:
  exclude_regex: "^DEBUG.*"
  skip:
    prod: true

features:
  - enable_shortcut_publish
  - enable_experimental_features

constants:
  DEFAULT_API_ROOT_URL: "https://api.fabric.microsoft.com"
```

**Deploy:**
```python
from fabric_cicd import deploy_with_config

deploy_with_config(
    config_file_path="path/to/config.yml",
    environment="dev",
    # Optional: override config at runtime
    config_override={"core": {"item_types_in_scope": ["Notebook"]}}
)
```

### Feature Flags

Enable optional/experimental features:
```python
from fabric_cicd import append_feature_flag

append_feature_flag("enable_lakehouse_unpublish")
append_feature_flag("enable_warehouse_unpublish")
append_feature_flag("enable_shortcut_publish")
append_feature_flag("enable_environment_variable_replacement")
append_feature_flag("enable_response_collection")
append_feature_flag("disable_print_identity")
```

**Feature Flag Reference:**
| Flag | Description | Experimental |
|------|-------------|--------------|
| `enable_lakehouse_unpublish` | Delete Lakehouses | |
| `enable_warehouse_unpublish` | Delete Warehouses | |
| `enable_sqldatabase_unpublish` | Delete SQL Databases | |
| `enable_eventhouse_unpublish` | Delete Eventhouses | |
| `enable_kqldatabase_unpublish` | Delete KQL Databases | |
| `enable_shortcut_publish` | Deploy shortcuts with Lakehouse | |
| `enable_environment_variable_replacement` | Use pipeline variables | |
| `disable_workspace_folder_publish` | Disable workspace subfolders | |
| `enable_experimental_features` | Enable experimental features | ☑️ |
| `enable_items_to_include` | Selective publish/unpublish items | ☑️ |
| `enable_exclude_folder` | Folder-based exclusion during publish | ☑️ |
| `enable_include_folder` | Folder-based inclusion during publish | ☑️ |
| `enable_shortcut_exclude` | Selective shortcut publishing | ☑️ |
| `enable_response_collection` | Collect API responses | |
| `continue_on_shortcut_failure` | Continue on shortcut failures | |

### Supported Item Types (24+)

| Item Type | Notes |
|-----------|-------|
| `Notebook` | `.py` and `.ipynb` formats supported. Both attached to lakehouses need parameterization. |
| `DataPipeline` | Same-workspace items auto-repointed; cross-workspace need parameterization. |
| `Environment` | Spark pools need `spark_pool` parameterization. High initial publish times (20+ min). |
| `Lakehouse` | Shortcuts disabled by default. Schemas not deployed unless a shortcut is present. |
| `SemanticModel` | Use `semantic_model_binding` for auto-connection binding. |
| `Report` | `byPath` refs auto-converted; `byConnection` refs need parameterization. |
| `Dataflow` | Ordered deployment for interdependent dataflows. Connections not source-controlled. |
| `Warehouse` | Shell-only deployment. DDL via DACPAC/dbt. CI collation supported. |
| `SQLDatabase` | Shell-only deployment. DDL via DACPAC/dbt. |
| `Eventhouse` | Streaming data may differ post-deploy. Unpublish disabled by default. |
| `KQLDatabase` | Within Eventhouse `.children` folder. Data not source-controlled. |
| `KQLQueryset` | Cluster/query URI auto-rebinding handled. |
| `Eventstream` | Same-workspace destinations auto-repointed. |
| `MirroredDatabase` | SAMI permissions needed for Azure SQL post-deploy. |
| `SparkJobDefinition` | `.py` and `.scala` only (no `.jar`). |
| `DataAgent` | Source items need parameterization. |
| `GraphQLApi` | Source/connections need parameterization. |
| `CopyJob` | Connections need manual config post-deploy. |
| `ApacheAirflowJob` | Connections not source-controlled. DAG references need parameterization. |
| `MLExperiment` | Only ML Shell created (create API limitation). |
| `MountedDataFactory` | Deploys mounted ADF to Fabric workspace. |
| `VariableLibrary` | Active value set defined by `environment` parameter. |
| `UserDataFunction` | Connections/libraries in `definitions.json` need parameterization. |
| `Activator` | `find_replace` not applied. Streaming data may not reflect immediately. |
| `KQLDashboard` | Cluster/query URI auto-rebinding handled. |

### Selective Deployment (Experimental)

> **Warning**: Not recommended due to dependency management risks.

**Folder-level filtering:**
```python
# Exclude folders matching regex (requires enable_exclude_folder)
publish_all_items(target_workspace, folder_path_exclude_regex="^/legacy_.*")

# Include only specific folders (requires enable_include_folder)
publish_all_items(target_workspace, folder_path_to_include=["/DEPLOY_FOLDER", "/DEPLOY_FOLDER/sub"])
```

**Item-level filtering:**
```python
# Exclude items matching regex (no feature flag needed)
publish_all_items(target_workspace, item_name_exclude_regex="^DEBUG.*")

# Include only specific items (requires enable_items_to_include)
publish_all_items(target_workspace, items_to_include=["MyNotebook.Notebook", "MyPipeline.DataPipeline"])
```

**Filter precedence** (exclusion before inclusion):
1. `item_name_exclude_regex`
2. `folder_path_exclude_regex`
3. `items_to_include`
4. `folder_path_to_include`

### Debugging
```python
from fabric_cicd import change_log_level
change_log_level("DEBUG")  # Writes all API calls to terminal + fabric_cicd.error.log
```

## Code Examples

### Basic Deployment with Azure CLI Auth
```python
from pathlib import Path
from azure.identity import AzureCliCredential
from fabric_cicd import FabricWorkspace, publish_all_items, unpublish_all_orphan_items

root_directory = Path(__file__).resolve().parent

target_workspace = FabricWorkspace(
    workspace_id="your-workspace-id",
    environment="PROD",
    repository_directory=str(root_directory / "workspace"),
    item_type_in_scope=["Notebook", "DataPipeline", "Environment", "Lakehouse"],
    token_credential=AzureCliCredential(),
)

publish_all_items(target_workspace)
unpublish_all_orphan_items(target_workspace)
```

### GitHub Actions Workflow
```yaml
name: Deploy Fabric
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install fabric-cicd
      - run: |
          python deploy.py
        env:
          WORKSPACE_ID: ${{ secrets.WORKSPACE_ID }}
          ENVIRONMENT: PROD
```

### Azure DevOps Pipeline
```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: UsePythonVersion@0
    inputs:
      versionSpec: '3.11'

  - script: pip install fabric-cicd
    displayName: 'Install fabric-cicd'

  - script: |
      python deploy.py
    displayName: 'Deploy to Fabric'
    env:
      WORKSPACE_ID: $(WORKSPACE_ID)
      ENVIRONMENT: PROD
```

### Parameterized Notebook Deployment
```yaml
# parameter.yml
find_replace:
  # Lakehouse GUID
  - find_value: "dev-lakehouse-guid"
    replace_value:
      PPE: "ppe-lakehouse-guid"
      PROD: "prod-lakehouse-guid"
    item_type: "Notebook"
    item_name: ["My Notebook"]

  # Lakehouse workspace ID
  - find_value: "dev-workspace-guid"
    replace_value:
      PPE: "$workspace.$id"
      PROD: "$workspace.$id"
    item_type: "Notebook"

  # Dynamic lakehouse ID using regex
  - find_value: '#\s*META\s+"default_lakehouse":\s*"([0-9a-fA-F]{8}-...)"'
    replace_value:
      PPE: "$items.Lakehouse.Example_LH.$id"
      PROD: "$items.Lakehouse.Example_LH.$id"
    is_regex: "true"
    item_type: "Notebook"
```

### Configuration-Based Deployment
```yaml
# config.yml
core:
  workspace_id:
    dev: "dev-workspace-guid"
    test: "test-workspace-guid"
    prod: "prod-workspace-guid"
  repository_directory: "."
  item_types_in_scope:
    - Notebook
    - DataPipeline
    - Environment
    - Lakehouse
    - SemanticModel
    - Report
  parameter: "parameter.yml"

publish:
  exclude_regex: "^DONT_DEPLOY.*"
  skip:
    dev: true
    test: false
    prod: false

features:
  - enable_shortcut_publish
  - enable_items_to_include
```

### Semantic Model Auto-Binding
```yaml
# parameter.yml
semantic_model_binding:
  default:
    connection_id:
      PPE: "ppe-gateway-connection-guid"
      PROD: "prod-gateway-connection-guid"
  models:
    - semantic_model_name: "SalesModel"
      connection_id:
        PPE: "ppe-sales-connection-guid"
        PROD: "prod-sales-connection-guid"
    - semantic_model_name: ["HRModel", "FinanceModel"]
      connection_id:
        _ALL_: "shared-connection-guid"
```

### Dataflow Inter-Dependency Parameterization
```yaml
# When Dataflow B sources from Dataflow A in the same workspace:
find_replace:
  - find_value: "0187104d-7a35-4abe-a2ca-a241ec81c8f1"  # source dataflowId in mashup.pq
    replace_value:
      PPE: "$items.Dataflow.Source Dataflow.$id"
      PROD: "$items.Dataflow.Source Dataflow.$id"
    file_path: "/Referencing Dataflow.Dataflow/mashup.pq"
```

### Environment Spark Pool Parameterization
```yaml
# parameter.yml
spark_pool:
  - instance_pool_id: "dev-pool-guid"
    replace_value:
      PPE:
        type: "Capacity"
        name: "CapacityPool_Medium"
      PROD:
        type: "Capacity"
        name: "CapacityPool_Large"
    item_name: "MyEnvironment"
```

### Fabric Notebook Deployment (Automatic Auth)
```python
import tempfile
import subprocess
import os
from fabric_cicd import FabricWorkspace, publish_all_items, unpublish_all_orphan_items

workspace_id = "your-workspace-id"
environment = "PROD"
repo_url = "https://github.com/your-org/your-repo.git"
repo_ref = "main"
workspace_directory = "workspace"

with tempfile.TemporaryDirectory(prefix="cloned_repo_") as temp_dir:
    result = subprocess.run(
        ["git", "clone", "--branch", repo_ref, "--single-branch", repo_url, temp_dir],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise Exception(f"Git clone failed: {result.stderr}")

    target_workspace = FabricWorkspace(
        workspace_id=workspace_id,
        environment=environment,
        repository_directory=os.path.join(temp_dir, workspace_directory),
        item_type_in_scope=["Notebook", "DataPipeline"],
        # No token_credential — Fabric Notebook auto-authenticates
    )
    publish_all_items(target_workspace)
    unpublish_all_orphan_items(target_workspace)
```

### Config Override at Runtime
```python
from fabric_cicd import deploy_with_config

override = {
    "core": {
        "item_types_in_scope": ["Notebook", "DataPipeline"]
    },
    "publish": {
        "skip": {"dev": False}  # Override: deploy even to dev
    }
}

deploy_with_config(
    config_file_path="config.yml",
    environment="dev",
    config_override=override
)
```

### Parameter File Templates (Split Large parameter.yml)
```yaml
# parameter.yml (main)
extend:
  - "./templates/nb_parameters.yml"
  - "./templates/pl_parameters.yml"

find_replace:
  - find_value: "shared-dev-guid"
    replace_value:
      PPE: "shared-ppe-guid"
      PROD: "shared-prod-guid"
```

## Common Patterns & Best Practices

### ALM Git Flow
1. Connect Dev workspace to Git (feature branch)
2. Develop items in Fabric UI or locally
3. Commit to feature branch via Git Sync
4. Merge feature → Deployed (main) branch
5. Cherry-pick to upper environments' Deployed branches
6. Deploy from Deployed branch using fabric-cicd (NOT via Git Sync)

### Parameterization Best Practices
1. **Use dynamic variables** (`$items`, `$workspace`) when possible to avoid hardcoding GUIDs
2. **Use regex** for find_value when matching patterns (e.g., lakehouse metadata headers)
3. **Filter by item_type and item_name** to scope replacements precisely
4. **Use file_path filters** to target specific files (e.g., `mashup.pq` for Dataflows)
5. **Test with `change_log_level("DEBUG")`** before production deployments
6. **Use `_ALL_`** when the same replacement applies to all environments

### Environment Strategy
- **DEV**: Development, Git Sync enabled, `publish.skip: true`
- **PPE/TEST**: Validation, may skip publish for testing
- **PROD**: Production, full deployment, schedules enabled

### Connection Management
- Connections are **NOT** source-controlled
- Always parameterize connection IDs in `parameter.yml`
- Use `semantic_model_binding` for automatic semantic model connection binding
- Deploying identity must have access to connections

### Deployment Order
fabric-cicd handles dependency ordering automatically:
1. Environments first (needed by Notebooks, Dataflows)
2. Lakehouses/Warehouses (needed by Notebooks, Dataflows, Reports)
3. Semantic Models (needed by Reports)
4. Dataflows (interdependent dataflows deployed in order)
5. Notebooks, Pipelines, Reports last

## Common Pitfalls & Troubleshooting

1. **DefaultAzureCredential deprecation**: Always use explicit `AzureCliCredential`, `AzurePowerShellCredential`, `ManagedIdentityCredential`, or `ClientSecretCredential`

2. **Parameter.yml environment mismatch**: The `environment` parameter must match a key in `parameter.yml`. If not found, replacements are skipped.

3. **Dynamic replacement failures**: Ensure item type and name are **case-sensitive** and **exact matches**. Verify the item exists in the `repository_directory`.

4. **Dataflow inter-dependencies**: When a Dataflow sources from another Dataflow in the same workspace, parameterize using `$items.Dataflow.<name>.$id` for the source dataflowId.

5. **Semantic Model binding limit**: Only one connection per Semantic Model. Multiple connections require manual post-deployment configuration.

6. **Warehouse/SQL Database shell-only**: These only deploy the item shell. Use DACPAC or dbt for DDL deployment.

7. **Environment publish times**: Environments with libraries can take 20+ minutes. The library handles long-running operations automatically.

8. **Lakehouse shortcuts**: Disabled by default. Enable with `enable_shortcut_publish` feature flag.

9. **Unpublish disabled**: Unpublish is disabled by default for Lakehouse, Warehouse, SQLDatabase, Eventhouse. Enable with respective feature flags.

10. **Folder exclusion vs inclusion**: `folder_exclude_regex` and `folder_path_to_include` are **mutually exclusive** — cannot use both for the same environment.

11. **YAML validation**: fabric-cicd validates `parameter.yml` at deployment start. Invalid YAML will abort deployment. Use `devtools/debug_parameterization.py` for pre-deployment validation.

12. **`_ALL_` vs `ALL`**: `_ALL_` (with underscores) is the special keyword. `ALL` without underscores is treated as a regular environment key.

## Related Resources
- [fabric-cicd GitHub Repository](https://github.com/microsoft/fabric-cicd)
- [fabric-cicd Documentation](https://microsoft.github.io/fabric-cicd/)
- [fabric-cicd Changelog](https://microsoft.github.io/fabric-cicd/latest/changelog/)
- [Microsoft Fabric CI/CD Overview](https://learn.microsoft.com/fabric/cicd/)
- [Fabric Git Integration](https://learn.microsoft.com/fabric/cicd/git-integration/)
- [Fabric Deployment Pipelines](https://learn.microsoft.com/fabric/cicd/deployment-pipelines/)
- [Azure Identity Documentation](https://learn.microsoft.com/python/api/azure-identity/)
- [Fabric REST APIs](https://learn.microsoft.com/rest/api/fabric/)

## Usage Instructions
When a user asks about fabric-cicd, Fabric CI/CD deployment, or parameterization:
- Recommend the appropriate deployment pattern (code-first vs config-based)
- Guide through authentication setup for their environment (local, ADO, GitHub, Fabric Notebook)
- Help craft `parameter.yml` with correct find_replace/key_value_replace/spark_pool/semantic_model_binding rules
- Explain feature flags needed for their use case
- Address item-type-specific limitations and parameterization requirements
- Provide CI/CD pipeline examples (Azure DevOps or GitHub Actions)
- Recommend debugging approaches using `change_log_level("DEBUG")`

Always reference the official fabric-cicd documentation and recommend testing with debug mode before production deployments.
