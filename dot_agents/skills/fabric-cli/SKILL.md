---
name: fabric-cli
description: Drive Microsoft Fabric from the terminal with the `fab` CLI - run and schedule notebooks, pipelines and Spark job definitions, browse workspaces/items/OneLake, import & export item definitions, manage Delta tables and ACLs, and make raw authenticated calls to the Fabric/OneLake/ARM/Power BI REST APIs. Use whenever the task involves running a Fabric notebook or pipeline, checking a job run's status, listing or fetching Fabric workspace items, uploading or downloading OneLake files, or calling a Fabric REST endpoint that has no dedicated tool.
---

# Fabric CLI (`fab`)

`fab` gives command-line access to Microsoft Fabric. Everything is addressed
through a **filesystem-like path**, and every path segment carries a **type
extension**.

Docs: https://microsoft.github.io/fabric-cli/ · Repo: https://github.com/microsoft/fabric-cli

## Non-negotiables

1. **`--help` only works at the top level. Sub-commands need `-h`.**
   `fab job run --help` → `! unknown command for "fab"`. Use `fab job run -h`.
2. **Never run bare `fab`** — with no arguments it drops into an interactive
   REPL and hangs a non-interactive shell. Always pass a command.
3. **Check auth before anything else** — but read the *output*, not the exit
   code. `fab auth status` exits `0` whether or not you are logged in; parse
   `.result.data[0].logged_in` from `--output_format json`. Logged out, other
   commands fail with `[AuthenticationFailed] Failed to get access token`.
4. **Destructive commands (`rm`, `mv`, `job run-rm`) prompt for confirmation.**
   In a script they will hang unless you pass `-f`. Confirm with the user
   *before* adding `-f`, not after.

## Paths

```
/<workspace>.Workspace/<folder>.Folder/<item>.<ItemType>
/<workspace>.Workspace/<lakehouse>.Lakehouse/Files/<path>
/<workspace>.Workspace/<lakehouse>.Lakehouse/Tables/<table>
/.capacities/<name>.Capacity          # tenant-level virtual items
/<workspace>.Workspace/.sparkpools/<name>.SparkPool
```

The extension is required and case-insensitive (`nb1.Notebook`, `nb1.notebook`).
Paths with spaces need quoting: `fab ls "Sales Analytics.Workspace"`.
Common types: `.Notebook .DataPipeline .SparkJobDefinition .Lakehouse .Warehouse
.SemanticModel .Report .Environment .Eventhouse .SQLDatabase .VariableLibrary`
(full list in `reference.md`). `fab desc .<type>` shows which commands a type
supports; `fab desc all` lists everything.

## Auth

```bash
fab auth status --output_format json | jq -r '.result.data[0].logged_in'
fab auth login                        # interactive browser (user must do this)
fab auth login -u <client_id> -p <secret> --tenant <tenant_id>   # service principal
fab auth login --identity                                        # managed identity
```

Interactive login needs a browser — **ask the user to run it** (`! fab auth login`)
rather than launching it from a background shell. For automation, env vars work
with no explicit login: `FAB_SPN_CLIENT_ID` + `FAB_SPN_CLIENT_SECRET` +
`FAB_TENANT_ID`, or `FAB_TOKEN` / `FAB_TOKEN_ONELAKE` / `FAB_TOKEN_AZURE`
(raw tokens are **not** auto-refreshed).

Some `fab api` calls are restricted under interactive user auth and need a
service principal instead.

## Running jobs — the main use case

Supported: `.Notebook`, `.DataPipeline`, `.SparkJobDefinition`, `.Lakehouse`
(table maintenance).

```bash
# async — returns immediately with a job instance id
fab job start ws1.Workspace/nb1.Notebook

# sync — polls until the job finishes
fab job run ws1.Workspace/nb1.Notebook --timeout 3600 --polling_interval 30
```

Parameters, `name:type=value`, comma-separated:

```bash
fab job run ws1.Workspace/nb1.Notebook \
  -P run_date:string=2026-08-21,batch:int=10,ratio:float=0.5,dry_run:bool=true
```
Notebook types: `string int float bool`. Pipeline types: those plus
`object array secureString`. Quote the whole `-P` value when it contains JSON:
`-P 'obj:object={"k":"v"},arr:array=[1,2,3]'`.

Notebook Spark config via `-C` (inline JSON or a file path):

```bash
fab job run ws1.Workspace/nb1.Notebook \
  -C '{"defaultLakehouse": {"name": "lh1", "id": "<lh-id>", "workspaceId": "<ws-id>"},
       "useStarterPool": false, "useWorkspacePool": "<pool-name>",
       "environment": {"id": "<env-id>", "name": "<env-name>"},
       "conf": {"spark.executor.memory": "4g"}}'
```

`-i` takes the raw run payload (`{"parameters": {...}, "configuration": {...}}`)
and **cannot be combined with `-P` or `-C`** — the CLI errors out. Use `-i` when
you need full control, `-P`/`-C` otherwise.

### Monitoring

```bash
fab job run-list   ws1.Workspace/nb1.Notebook            # run history
fab job run-status ws1.Workspace/nb1.Notebook --id <instance_id>
fab job run-cancel ws1.Workspace/nb1.Notebook --id <instance_id> --wait
```
Statuses: `NotStarted`, `InProgress`, `Completed`, `Failed`, `Cancelled`, `Deduped`.

### Exit-code trap when scripting `job run`

`job run` exits **non-zero only on `Failed`**. `Cancelled` and `Deduped` finish
with a *warning* and exit `0`. A timeout also cancels the job by default
(`job_cancel_ontimeout=true`), so a timed-out run can look like a success.
When success actually matters, re-check explicitly:

```bash
fab job run ws1.Workspace/nb1.Notebook --timeout 1800 --output_format json \
  | tee /tmp/run.json
fab job run-list ws1.Workspace/nb1.Notebook --output_format json \
  | jq -r '.result.data[0] | "\(.status) \(.id)"'
```

### Scheduling

```bash
fab job run-sch ws1.Workspace/pip1.DataPipeline --type cron   --interval 10 \
  --start 2026-08-21T09:00:00 --end 2026-09-21T10:00:00 --enable
fab job run-sch ws1.Workspace/pip1.DataPipeline --type daily  --interval 10:00,16:00 --start ... --end ...
fab job run-sch ws1.Workspace/pip1.DataPipeline --type weekly --interval 10:00,16:00 --days Monday,Friday --start ... --end ...

fab job run-list   ws1.Workspace/pip1.DataPipeline --schedule
fab job run-status ws1.Workspace/pip1.DataPipeline --id <schedule_id> --schedule
fab job run-update ws1.Workspace/pip1.DataPipeline --id <schedule_id> --disable
fab job run-rm     ws1.Workspace/pip1.DataPipeline --id <schedule_id> -f
```
`--start`/`--end` are **UTC**; new schedules are disabled unless `--enable`.

## Raw REST calls

```bash
fab api workspaces                                    # GET is the default
fab api -X post workspaces/<ws-id>/lakehouses -i '{"displayName": "lh1"}'
fab api -X post workspaces/<ws-id>/items -i ./item.json
fab api -A storage ws1.Workspace/lh1.Lakehouse/Files -P resource=filesystem,recursive=false
fab api -A azure   subscriptions/<sub>/providers/Microsoft.Fabric/capacities?api-version=2023-11-01
fab api -A powerbi groups/<group-id>
```
`-A` audience: `fabric` (default) · `storage` (OneLake) · `azure` (ARM) ·
`powerbi`. `-q` applies a JMESPath filter, `--show_headers` includes response
headers. Reach for `fab api` whenever a Fabric REST endpoint has no dedicated
`fab` command — it handles token acquisition for you.

## Browsing and item definitions

```bash
fab ls                                       # workspaces
fab ls ws1.Workspace -l                      # items with detail
fab ls ws1.Workspace -q "[?contains(name, 'Notebook')].{name:name,id:id}"
fab exists ws1.Workspace/nb1.Notebook        # exit code is the answer
fab get ws1.Workspace/lh1.Lakehouse -q properties.sqlEndpointProperties
fab get ws1.Workspace/nb1.Notebook -v        # every JSON property

fab export ws1.Workspace/nb1.Notebook -o /tmp          # definition to disk
fab import nb2.Notebook -i /tmp/nb1.Notebook -f        # create/update from disk
fab mkdir ws1.Workspace/lh1.Lakehouse -P enableSchemas=true   # alias: create
fab set ws1.Workspace/nb1.Notebook -q displayName -i "New name"
```
`fab mkdir <path> -P` with no value prints the parameters that type accepts.
Export/import/copy **drop the sensitivity label** from the definition.

## Scripting

Set `--output_format json` (or `fab config set output_format json`) and parse
the envelope:

```json
{"timestamp": "...", "status": "Success", "command": "ls",
 "result": {"data": [ ... ], "message": "..."}}
```
Payload lives at `.result.data`; `.status` is `Success` or `Failure`.

Exit codes: `0` success · `1` general error · `2` usage error or cancelled ·
`4` authorization required. In practice `4` only appears when Fabric itself
returns an unauthorized response — a *local* missing/expired login surfaces as
`1` with an `[AuthenticationFailed]` message, so treat `1` as "could be auth"
and re-check `fab auth status`.

Useful settings (`fab config set <key> <value>`, `fab config ls` to view):
`output_format`, `job_cancel_ontimeout`, `debug_enabled`, `default_capacity`,
`cache_enabled`, `show_hidden`, `folder_listing_enabled`.
Stale results after an out-of-band change → `fab config clear-cache`.

## Gotchas

- Docs sometimes write `fab create`; the real command is `mkdir` (`create` is an
  alias). Docs also mislabel some `--id` args as `<schedule_id>` when a job
  *instance* id is meant — `run-cancel`/`run-status` without `--schedule` take
  instance ids.
- In **zsh**, `for c in "job run"; fab $c -h` does not word-split; loops over
  multi-word commands need `eval` or `${=c}`.
- `fab job run` on a `.Lakehouse` means *table maintenance*, driven entirely by
  `-i` (`tableName`, `optimizeSettings`, `vacuumSettings`). Prefer
  `fab table optimize` / `fab table vacuum` for the readable form.
- `ls`/`get` are cached; add `fab config clear-cache` when verifying a change
  someone made in the portal.

`reference.md` in this directory holds the full command/flag/type tables.
