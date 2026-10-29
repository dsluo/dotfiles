# `fab` reference (verified against fabric-cli 1.6.1)

Regenerate any section with `fab <command> -h` / `fab <command> <sub> -h`.
Remember: `--help` works only at the top level; sub-commands need `-h`.

## Command map

### Core (filesystem-style)
| Command | Signature | Notes |
|---|---|---|
| `ls` (`dir`) | `ls <path> [-l] [-a] [-q <jmespath>]` | `-l` detail, `-a` all, `-q` filter |
| `cd` | `cd <path>` | REPL / persisted-context only |
| `pwd` | `pwd` | |
| `exists` | `exists <path>` | answer is the exit code |
| `get` | `get <path> [-q <jmespath>] [-o <out>] [-v] [-f]` | `-v` all properties |
| `set` | `set <path> -q <json_path> -i <value> [-f]` | |
| `mkdir` (`create`) | `mkdir <path> [-P k=v,...]` | `-P` alone lists supported params |
| `rm` (`del`) | `rm <path> [-f] [--hard]` | `--hard` = unrecoverable, items only |
| `cp` (`copy`) | `cp <from> <to> [-f] [-r] [-bpc]` | |
| `mv` (`move`) | `mv <from> <to> [-f] [-r]` | |
| `ln` (`mklink`) | `ln <path> --type <t> [--target <p>] [-i <json>] [-f]` | types: `adlsGen2 amazonS3 dataverse googleCloudStorage oneLake s3Compatible` |
| `import` | `import <path> -i <local_dir> [--format <f>] [-f]` | |
| `export` | `export <path> -o <out> [-a] [--format <f>] [-f]` | `-a` export all |
| `find` | `find <text> [-P type=[A,B] \| type!=X] [-l] [-q]` | OneLake catalog search |
| `open` | `open <path>` | launches the browser |
| `start` / `stop` | `start\|stop <path> [-f]` | capacities, mirroring |
| `assign` / `unassign` | `assign <path> -W <workspace> [-f]` | capacities, domains |
| `desc` | `desc <path\|.type\|all>` | which commands a type supports |
| `deploy` | `deploy --config <file> -tenv <env> [-P '<json>'] [-f]` | config-driven multi-item deploy |

### `job`
| Command | Signature |
|---|---|
| `job start` | `job start <path> [-P <params>] [-C <config>] [-i <json>]` |
| `job run` | `job run <path> [-P] [-C] [-i] [--timeout <s>] [--polling_interval <s>]` |
| `job run-cancel` | `job run-cancel <path> --id <instance_id> [-w]` |
| `job run-list` | `job run-list <path> [--schedule]` |
| `job run-status` | `job run-status <path> --id <id> [--schedule]` |
| `job run-sch` | `job run-sch <path> [-i <json>] [--type cron\|daily\|weekly] [--interval] [--start] [--end] [--days] [--enable]` |
| `job run-update` | `job run-update <path> --id <schedule_id> [-i] [--type] [--interval] [--start] [--end] [--days] [--enable\|--disable]` |
| `job run-rm` | `job run-rm <path> --id <schedule_id> [-f]` |

`-i` is mutually exclusive with `-P`/`-C`. `--start`/`--end` are UTC.
Job runnable types: `.Notebook`, `.DataPipeline`, `.SparkJobDefinition`,
`.Lakehouse` (table maintenance).

### `api`
`api <endpoint> [-X get|post|put|patch|delete] [-i <json_or_path>] [-A fabric|storage|azure|powerbi] [-P k=v,...] [-H k=v,...] [-q <jmespath>] [--show_headers]`

### `auth`
`auth login [-u <client_id>] [-p <secret_or_cert_password>] [-t <tenant>] [-I] [--certificate <pem|p12|pfx>] [--federated-token <t>]`
`auth logout` · `auth status`

### `config`
`config ls` · `config get <key>` · `config set <key> <value>` · `config clear-cache`

### `table` (Lakehouse Delta tables)
| Command | Signature |
|---|---|
| `table load` | `table load <Tables/name> --file <Files/path> [--extension <ext>] [--mode append\|overwrite] [--format format=csv,header=true,delimiter=',']` |
| `table optimize` | `table optimize <Tables/name> [--vorder] [--zorder col1,col2]` |
| `table vacuum` | `table vacuum <Tables/name> [--retain_n_hours 168]` |
| `table schema` | `table schema <Tables/name>` |

### `acl` / `label` (admin)
`acl ls <path> [-l] [-q]` · `acl get <path> [-q] [-o]` ·
`acl set <path> -I <objectId> -R <role> [-f]` · `acl rm <path> -I <upn|clientId|objectId|groupName> [-f]`

Roles — workspaces: `Admin Member Contributor Viewer`; connections:
`Owner User UserWithReshare`; gateways: `Admin ConnectionCreator ConnectionCreatorWithResharing`.

`label list-local` · `label set <path> -n <name> [-f]` · `label rm <path> [-f]`
(`label set` first needs `fab config set local_definition_labels <json_path>`).

## Item type extensions

`.Notebook .SparkJobDefinition .DataPipeline .Report .SemanticModel .KQLDatabase
.KQLDashboard .KQLQueryset .Lakehouse .Map .Warehouse .SQLDatabase
.MirroredDatabase .MirroredWarehouse .Eventhouse .Eventstream .Dashboard
.Datamart .CopyJob .Environment .MLExperiment .MLModel .MountedDataFactory
.PaginatedReport .Reflex .SQLEndpoint .VariableLibrary .GraphQLApi .Dataflow
.ApacheAirflowJob .CosmosDBDatabase .DigitalTwinBuilder .DigitalTwinBuilderFlow
.GraphQuerySet .UserDataFunction`

Not creatable via `mkdir`: `.Dashboard .Datamart .MirroredWarehouse
.PaginatedReport .SQLEndpoint`.

Items exposing a OneLake folder tree: `.Lakehouse .Warehouse .MirroredDatabase
.SQLDatabase .SemanticModel .KQLDatabase`.

Copyable with `cp`: `.Notebook .SparkJobDefinition .DataPipeline .Report
.SemanticModel .KQLDatabase .KQLDashboard .KQLQueryset .Eventhouse .Eventstream
.MirroredDatabase .Reflex .DigitalTwinBuilder .DigitalTwinBuilderFlow .Map
.MountedDataFactory .CopyJob .VariableLibrary`.

### Virtual elements
Workspace-scoped containers: `.sparkpools .managedidentities
.managedprivateendpoints .externaldatashares` → items `.SparkPool
.ManagedIdentity .ManagedPrivateEndpoint .ExternalDataShare`.

Tenant-scoped containers: `.capacities .connections .domains .gateways` →
items `.Capacity .Connection .Domain .Gateway`.

## Settings (`fab config set <key> <value>`)

| Key | Type | Default |
|---|---|---|
| `output_format` | `text` \| `json` | `text` |
| `cache_enabled` | bool | `true` |
| `check_cli_version_updates` | bool | `true` |
| `debug_enabled` | bool | `false` |
| `context_persistence_enabled` | bool | `false` |
| `encryption_fallback_enabled` | bool (not persisted) | `false` |
| `job_cancel_ontimeout` | bool | `true` |
| `local_definition_labels` | path | — |
| `output_item_sort_criteria` | `byname` \| `bytype` | `byname` |
| `show_hidden` | bool | `false` |
| `folder_listing_enabled` | bool | `false` |
| `workspace_private_links_enabled` | bool | `false` |
| `default_capacity` | string | — |
| `default_open_experience` | `fabric` \| `powerbi` | `fabric` |
| `default_az_subscription_id` / `default_az_resource_group` / `default_az_location` / `default_az_admin` | string | — |

## Environment variables

Pick exactly one method and supply all of its variables — auth then happens
without an explicit `fab auth login`.

| Method | Variables |
|---|---|
| Raw tokens | `FAB_TOKEN`, `FAB_TOKEN_ONELAKE`, `FAB_TOKEN_AZURE`, `FAB_TENANT_ID` |
| SPN + secret | `FAB_SPN_CLIENT_ID`, `FAB_SPN_CLIENT_SECRET`, `FAB_TENANT_ID` |
| SPN + certificate | `FAB_SPN_CLIENT_ID`, `FAB_SPN_CERT_PATH`, `FAB_SPN_CERT_PASSWORD` (optional), `FAB_TENANT_ID` |
| SPN + federated token | `FAB_SPN_CLIENT_ID`, `FAB_SPN_FEDERATED_TOKEN`, `FAB_TENANT_ID` |
| Managed identity | `FAB_MANAGED_IDENTITY=true`, `FAB_SPN_CLIENT_ID` (user-assigned only) |

Raw tokens are **not** refreshed by the CLI. Service-principal and managed-identity
auth both require the tenant switch *Allow service principals to use Fabric APIs*.

## Exit codes

`0` success · `1` general error · `2` usage error / cancelled · `4` authorization required.

`4` is returned only when a Fabric API call comes back unauthorized. Not being
logged in locally raises `[AuthenticationFailed] Failed to get access token`
and exits `1`. `fab auth status` always exits `0` — read
`.result.data[0].logged_in` instead.

`job run` maps job status to exit code as: `Failed` → error; `Completed`,
`Cancelled`, `Deduped` → `0` (the last two print a warning only).

## JSON output envelope

```json
{
  "timestamp": "2026-08-21T00:00:00Z",
  "status": "Success",
  "command": "ls",
  "result": { "data": [ {...} ], "message": "...", "error_code": "..." }
}
```
`error_code` appears only when `status` is `Failure`. `data` is always a list.

## Doc pages

Base `https://microsoft.github.io/fabric-cli/` (note: the published sitemap has
a typo'd host — use `microsoft.github.io`).

- `essentials/` — `hierarchy` `resource_types` `parameters` `input`
  `output_format` `modes` `settings` `env_vars` `exit_codes` `cache`
  `file_storage` `autocompletion`
- `commands/` — `api` `auth` `config` `acls` `desc` `find` `jobs` `labels`
  `tables`, plus `commands/fs/<cmd>` for the filesystem commands
- `examples/` — `job_examples` `api_examples` `auth_examples` `item_examples`
  `onelake_examples` `table_examples` `workspace_examples` `shortcut_examples`
  `acl_examples` `config_examples` `capacity_examples` `connection_examples`
  `domain_examples` `folder_examples` `gateway_examples` `sparkpool_examples`
  `managedidentity_examples` `managedprivateendpoint_examples`
  `externaldatashare_examples` `refresh_semantic_model_example`
  `desc_examples` `label_examples`
