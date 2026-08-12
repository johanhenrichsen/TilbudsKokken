# Tilbudskokken deal pipeline — daily scheduling

The pipeline (`scripts/run.js`) fetches each tracked supermarket's current weekly
catalog from the Tjek/eTilbudsavis API, archives a per-store PDF, enriches offers via
Claude, and writes `tilbudsaviser.xlsx`. Only catalogs that changed since the last run
are processed, so running it daily is cheap.

## One-time: register the daily task (Windows Task Scheduler)

Runs every day at 06:00 under the current user. Adjust `/ST` for a different time.

```
schtasks /Create /SC DAILY /TN "TilbudskokkenPipeline" /TR "\"C:\Users\Johan\Documents\Tilbudskokken\tilbudsapp\scripts\run-daily.cmd\"" /ST 06:00 /RL LIMITED /F
```

`run-daily.cmd` changes into the repo root and runs the pipeline, appending all output
to `scripts/state/run.log`.

## Run it once manually

Either trigger the scheduled task:

```
schtasks /Run /TN "TilbudskokkenPipeline"
```

…or run the pipeline directly from the repo root:

```
node scripts/run.js            # process all changed catalogs
node scripts/run.js --dry-run  # show what would be processed, no writes, no token spend
node scripts/run.js --dealer=netto --limit=1   # single store, useful for testing
node scripts/run.js --force    # reprocess every catalog, ignoring saved state
```

## View logs

```
type scripts\state\run.log
```

The pipeline also keeps per-dealer processing state in `scripts/state/processed.json`
(last catalog id + timestamp + item count per store).

## Remove the scheduled task

```
schtasks /Delete /TN "TilbudskokkenPipeline" /F
```

## Notes

- No API key is required for the Tjek API; enrichment uses `VITE_CLAUDE_KEY` from `.env`.
- Aldi and Dagli'Brugsen are not on the Tjek platform and are skipped automatically.
- Generated artifacts (`catalogs/`, `data/`, `scripts/state/`) are git-ignored.
