import type { GitHubActionsJob, GitHubActionsRun } from '../lib/ciTrace';

// Captured from this repository's own Actions history with
//   gh api repos/rtkelly-labs/design-system/actions/runs/<id>
//   gh api repos/rtkelly-labs/design-system/actions/runs/<id>/jobs
// and kept as the API returned them, so the stories exercise `githubRunToSpans`
// on real data rather than on a shape written to suit it.

/** main after #404: `visual (3)` fails on an axe violation, and `ci` fails because it did. */
export const mainRedRun: { run: GitHubActionsRun; jobs: GitHubActionsJob[] } = {
  "run": {
    "conclusion": "failure",
    "created_at": "2026-10-24T08:46:57Z",
    "display_title": "feat(site): MDX posts with registry-derived sections, and the Colour \u2026",
    "event": "push",
    "head_branch": "main",
    "head_sha": "27f95447ba0770c083ff63f04ec23ee50c79b4e3",
    "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081",
    "id": 40079379081,
    "name": "CI & Visual Regression Checks",
    "run_attempt": 1,
    "run_started_at": "2026-10-24T08:46:57Z",
    "status": "completed",
    "updated_at": "2026-10-24T08:51:09Z"
  },
  "jobs": [
    {
      "completed_at": "2026-10-24T08:48:28Z",
      "conclusion": "success",
      "created_at": "2026-10-24T08:46:57Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535046",
      "id": 120829535046,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "build",
      "runner_name": "GitHub Actions 1000007979",
      "started_at": "2026-10-24T08:46:59Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:01Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:02Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-24T08:47:01Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:13Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 3,
          "started_at": "2026-10-24T08:47:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:23Z",
          "conclusion": "success",
          "name": "Build Package",
          "number": 4,
          "started_at": "2026-10-24T08:47:13Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:23Z",
          "conclusion": "success",
          "name": "Bundle Size Budget",
          "number": 5,
          "started_at": "2026-10-24T08:47:23Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "success",
          "name": "Dependency Cost",
          "number": 6,
          "started_at": "2026-10-24T08:47:23Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:33Z",
          "conclusion": "success",
          "name": "Import Cost",
          "number": 7,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:34Z",
          "conclusion": "success",
          "name": "Public API Surface",
          "number": 8,
          "started_at": "2026-10-24T08:47:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:25Z",
          "conclusion": "success",
          "name": "Report Generator",
          "number": 9,
          "started_at": "2026-10-24T08:47:34Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:26Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 17,
          "started_at": "2026-10-24T08:48:25Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:26Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 18,
          "started_at": "2026-10-24T08:48:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:26Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 19,
          "started_at": "2026-10-24T08:48:26Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:47:47Z",
      "conclusion": "success",
      "created_at": "2026-10-24T08:46:58Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535220",
      "id": 120829535220,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "build",
      "runner_name": "GitHub Actions 1000007983",
      "started_at": "2026-10-24T08:46:59Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:00Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:01Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:11Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 3,
          "started_at": "2026-10-24T08:47:01Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:20Z",
          "conclusion": "success",
          "name": "Build Package",
          "number": 4,
          "started_at": "2026-10-24T08:47:11Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:46Z",
          "conclusion": "success",
          "name": "Applied Site",
          "number": 5,
          "started_at": "2026-10-24T08:47:20Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:46Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 9,
          "started_at": "2026-10-24T08:47:46Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:46Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 10,
          "started_at": "2026-10-24T08:47:46Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:46Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 11,
          "started_at": "2026-10-24T08:47:46Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:50:32Z",
      "conclusion": "success",
      "created_at": "2026-10-24T08:46:58Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535224",
      "id": 120829535224,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "visual (2)",
      "runner_name": "GitHub Actions 1000007986",
      "started_at": "2026-10-24T08:46:59Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:02Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-24T08:47:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:38Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:38Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-24T08:47:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:38Z",
          "conclusion": "success",
          "name": "Rendering Inputs",
          "number": 5,
          "started_at": "2026-10-24T08:47:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:38Z",
          "conclusion": "skipped",
          "name": "Previous Verdict",
          "number": 6,
          "started_at": "2026-10-24T08:47:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:38Z",
          "conclusion": "skipped",
          "name": "Verdict Reused",
          "number": 7,
          "started_at": "2026-10-24T08:47:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:38Z",
          "conclusion": "success",
          "name": "Shard Key",
          "number": 8,
          "started_at": "2026-10-24T08:47:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:39Z",
          "conclusion": "success",
          "name": "Upload Shard Key",
          "number": 9,
          "started_at": "2026-10-24T08:47:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:52Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 10,
          "started_at": "2026-10-24T08:47:39Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:53Z",
          "conclusion": "success",
          "name": "Cache Storybook",
          "number": 11,
          "started_at": "2026-10-24T08:47:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:08Z",
          "conclusion": "success",
          "name": "Build Storybook",
          "number": 12,
          "started_at": "2026-10-24T08:47:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:08Z",
          "conclusion": "skipped",
          "name": "Visual Coverage",
          "number": 13,
          "started_at": "2026-10-24T08:48:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:08Z",
          "conclusion": "skipped",
          "name": "Docgen Props",
          "number": 14,
          "started_at": "2026-10-24T08:48:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:08Z",
          "conclusion": "skipped",
          "name": "Story Conventions",
          "number": 15,
          "started_at": "2026-10-24T08:48:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:37Z",
          "conclusion": "success",
          "name": "Run Visual Regression Tests",
          "number": 16,
          "started_at": "2026-10-24T08:48:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:24Z",
          "conclusion": "success",
          "name": "Run Accessibility Tests",
          "number": 17,
          "started_at": "2026-10-24T08:48:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:26Z",
          "conclusion": "success",
          "name": "Story Selection (shadow)",
          "number": 18,
          "started_at": "2026-10-24T08:50:24Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:26Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 19,
          "started_at": "2026-10-24T08:50:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:27Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 20,
          "started_at": "2026-10-24T08:50:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:27Z",
          "conclusion": "skipped",
          "name": "Upload Playwright Report on Failure",
          "number": 21,
          "started_at": "2026-10-24T08:50:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:28Z",
          "conclusion": "success",
          "name": "Upload Generated Snapshots Artifact",
          "number": 22,
          "started_at": "2026-10-24T08:50:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:29Z",
          "conclusion": "success",
          "name": "Post Cache Storybook",
          "number": 41,
          "started_at": "2026-10-24T08:50:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:30Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 42,
          "started_at": "2026-10-24T08:50:29Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:30Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 43,
          "started_at": "2026-10-24T08:50:30Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:30Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 44,
          "started_at": "2026-10-24T08:50:30Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:30Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 45,
          "started_at": "2026-10-24T08:50:30Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:47:38Z",
      "conclusion": "success",
      "created_at": "2026-10-24T08:46:58Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535250",
      "id": 120829535250,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "test",
      "runner_name": "GitHub Actions 1000007982",
      "started_at": "2026-10-24T08:46:59Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:01Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:02Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-24T08:47:01Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:10Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 3,
          "started_at": "2026-10-24T08:47:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:17Z",
          "conclusion": "success",
          "name": "Type Check",
          "number": 4,
          "started_at": "2026-10-24T08:47:10Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:35Z",
          "conclusion": "success",
          "name": "Unit Tests and Coverage",
          "number": 5,
          "started_at": "2026-10-24T08:47:17Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:35Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 6,
          "started_at": "2026-10-24T08:47:35Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:36Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 7,
          "started_at": "2026-10-24T08:47:35Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:36Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 13,
          "started_at": "2026-10-24T08:47:36Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:36Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 14,
          "started_at": "2026-10-24T08:47:36Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 15,
          "started_at": "2026-10-24T08:47:36Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:47:51Z",
      "conclusion": "success",
      "created_at": "2026-10-24T08:46:58Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535257",
      "id": 120829535257,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "lint",
      "runner_name": "GitHub Actions 1000007981",
      "started_at": "2026-10-24T08:47:00Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:02Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:03Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-24T08:47:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:03Z",
          "conclusion": "skipped",
          "name": "Conventional PR Title",
          "number": 3,
          "started_at": "2026-10-24T08:47:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:12Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 4,
          "started_at": "2026-10-24T08:47:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:12Z",
          "conclusion": "success",
          "name": "Theme Token Drift",
          "number": 5,
          "started_at": "2026-10-24T08:47:12Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:12Z",
          "conclusion": "success",
          "name": "Design Token Drift",
          "number": 6,
          "started_at": "2026-10-24T08:47:12Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:13Z",
          "conclusion": "success",
          "name": "Contrast Gate",
          "number": 7,
          "started_at": "2026-10-24T08:47:12Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:13Z",
          "conclusion": "success",
          "name": "Documented figures",
          "number": 8,
          "started_at": "2026-10-24T08:47:13Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:15Z",
          "conclusion": "success",
          "name": "Documented snippets",
          "number": 9,
          "started_at": "2026-10-24T08:47:13Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:15Z",
          "conclusion": "success",
          "name": "Intent skills",
          "number": 10,
          "started_at": "2026-10-24T08:47:15Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:16Z",
          "conclusion": "success",
          "name": "Documented components",
          "number": 11,
          "started_at": "2026-10-24T08:47:15Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:16Z",
          "conclusion": "success",
          "name": "Story Documentation",
          "number": 12,
          "started_at": "2026-10-24T08:47:16Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:17Z",
          "conclusion": "success",
          "name": "Component contract",
          "number": 13,
          "started_at": "2026-10-24T08:47:16Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:18Z",
          "conclusion": "success",
          "name": "Slot contract",
          "number": 14,
          "started_at": "2026-10-24T08:47:17Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:19Z",
          "conclusion": "success",
          "name": "Shipped licences",
          "number": 15,
          "started_at": "2026-10-24T08:47:18Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:19Z",
          "conclusion": "success",
          "name": "Reference Material",
          "number": 16,
          "started_at": "2026-10-24T08:47:19Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:20Z",
          "conclusion": "success",
          "name": "ESLint Cache",
          "number": 17,
          "started_at": "2026-10-24T08:47:19Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:43Z",
          "conclusion": "success",
          "name": "Lint",
          "number": 18,
          "started_at": "2026-10-24T08:47:20Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:43Z",
          "conclusion": "success",
          "name": "CSS Surface",
          "number": 19,
          "started_at": "2026-10-24T08:47:43Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:44Z",
          "conclusion": "success",
          "name": "Hue-named call sites",
          "number": 20,
          "started_at": "2026-10-24T08:47:43Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:45Z",
          "conclusion": "success",
          "name": "Terminal schemes",
          "number": 21,
          "started_at": "2026-10-24T08:47:44Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:46Z",
          "conclusion": "success",
          "name": "Font Reachability",
          "number": 22,
          "started_at": "2026-10-24T08:47:45Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:47Z",
          "conclusion": "success",
          "name": "Dependencies",
          "number": 23,
          "started_at": "2026-10-24T08:47:46Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:47Z",
          "conclusion": "success",
          "name": "Governance",
          "number": 24,
          "started_at": "2026-10-24T08:47:47Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:48Z",
          "conclusion": "success",
          "name": "Post ESLint Cache",
          "number": 46,
          "started_at": "2026-10-24T08:47:47Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:49Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 47,
          "started_at": "2026-10-24T08:47:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:49Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 48,
          "started_at": "2026-10-24T08:47:49Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:49Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 49,
          "started_at": "2026-10-24T08:47:49Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:51:02Z",
      "conclusion": "success",
      "created_at": "2026-10-24T08:46:58Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535258",
      "id": 120829535258,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "visual (1)",
      "runner_name": "GitHub Actions 1000007984",
      "started_at": "2026-10-24T08:46:59Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:01Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:30Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-24T08:47:01Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-24T08:47:30Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "success",
          "name": "Rendering Inputs",
          "number": 5,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "skipped",
          "name": "Previous Verdict",
          "number": 6,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "skipped",
          "name": "Verdict Reused",
          "number": 7,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:31Z",
          "conclusion": "success",
          "name": "Shard Key",
          "number": 8,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:32Z",
          "conclusion": "success",
          "name": "Upload Shard Key",
          "number": 9,
          "started_at": "2026-10-24T08:47:31Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:43Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 10,
          "started_at": "2026-10-24T08:47:32Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:44Z",
          "conclusion": "success",
          "name": "Cache Storybook",
          "number": 11,
          "started_at": "2026-10-24T08:47:43Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:02Z",
          "conclusion": "success",
          "name": "Build Storybook",
          "number": 12,
          "started_at": "2026-10-24T08:47:44Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:03Z",
          "conclusion": "success",
          "name": "Visual Coverage",
          "number": 13,
          "started_at": "2026-10-24T08:48:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:03Z",
          "conclusion": "success",
          "name": "Docgen Props",
          "number": 14,
          "started_at": "2026-10-24T08:48:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:04Z",
          "conclusion": "success",
          "name": "Story Conventions",
          "number": 15,
          "started_at": "2026-10-24T08:48:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:38Z",
          "conclusion": "success",
          "name": "Run Visual Regression Tests",
          "number": 16,
          "started_at": "2026-10-24T08:48:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:52Z",
          "conclusion": "success",
          "name": "Run Accessibility Tests",
          "number": 17,
          "started_at": "2026-10-24T08:48:38Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:55Z",
          "conclusion": "success",
          "name": "Story Selection (shadow)",
          "number": 18,
          "started_at": "2026-10-24T08:50:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:55Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 19,
          "started_at": "2026-10-24T08:50:55Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:56Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 20,
          "started_at": "2026-10-24T08:50:55Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:56Z",
          "conclusion": "skipped",
          "name": "Upload Playwright Report on Failure",
          "number": 21,
          "started_at": "2026-10-24T08:50:56Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:58Z",
          "conclusion": "success",
          "name": "Upload Generated Snapshots Artifact",
          "number": 22,
          "started_at": "2026-10-24T08:50:56Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:59Z",
          "conclusion": "success",
          "name": "Post Cache Storybook",
          "number": 41,
          "started_at": "2026-10-24T08:50:58Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:51:00Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 42,
          "started_at": "2026-10-24T08:50:59Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:51:00Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 43,
          "started_at": "2026-10-24T08:51:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:51:00Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 44,
          "started_at": "2026-10-24T08:51:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:51:00Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 45,
          "started_at": "2026-10-24T08:51:00Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:50:51Z",
      "conclusion": "failure",
      "created_at": "2026-10-24T08:46:58Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120829535310",
      "id": 120829535310,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "visual (3)",
      "runner_name": "GitHub Actions 1000007987",
      "started_at": "2026-10-24T08:47:00Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:47:01Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:47:00Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:35Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-24T08:47:01Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-24T08:47:35Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "success",
          "name": "Rendering Inputs",
          "number": 5,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "skipped",
          "name": "Previous Verdict",
          "number": 6,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "skipped",
          "name": "Verdict Reused",
          "number": 7,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:37Z",
          "conclusion": "success",
          "name": "Shard Key",
          "number": 8,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:39Z",
          "conclusion": "success",
          "name": "Upload Shard Key",
          "number": 9,
          "started_at": "2026-10-24T08:47:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:52Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 10,
          "started_at": "2026-10-24T08:47:39Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:47:52Z",
          "conclusion": "success",
          "name": "Cache Storybook",
          "number": 11,
          "started_at": "2026-10-24T08:47:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:06Z",
          "conclusion": "success",
          "name": "Build Storybook",
          "number": 12,
          "started_at": "2026-10-24T08:47:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:06Z",
          "conclusion": "skipped",
          "name": "Visual Coverage",
          "number": 13,
          "started_at": "2026-10-24T08:48:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:06Z",
          "conclusion": "skipped",
          "name": "Docgen Props",
          "number": 14,
          "started_at": "2026-10-24T08:48:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:06Z",
          "conclusion": "skipped",
          "name": "Story Conventions",
          "number": 15,
          "started_at": "2026-10-24T08:48:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:48:34Z",
          "conclusion": "success",
          "name": "Run Visual Regression Tests",
          "number": 16,
          "started_at": "2026-10-24T08:48:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:39Z",
          "conclusion": "failure",
          "name": "Run Accessibility Tests",
          "number": 17,
          "started_at": "2026-10-24T08:48:34Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:42Z",
          "conclusion": "success",
          "name": "Story Selection (shadow)",
          "number": 18,
          "started_at": "2026-10-24T08:50:39Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:43Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 19,
          "started_at": "2026-10-24T08:50:42Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:44Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 20,
          "started_at": "2026-10-24T08:50:43Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:46Z",
          "conclusion": "success",
          "name": "Upload Playwright Report on Failure",
          "number": 21,
          "started_at": "2026-10-24T08:50:44Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:48Z",
          "conclusion": "success",
          "name": "Upload Generated Snapshots Artifact",
          "number": 22,
          "started_at": "2026-10-24T08:50:46Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:48Z",
          "conclusion": "skipped",
          "name": "Post Cache Storybook",
          "number": 41,
          "started_at": "2026-10-24T08:50:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:48Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 42,
          "started_at": "2026-10-24T08:50:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:48Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 43,
          "started_at": "2026-10-24T08:50:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:49Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 44,
          "started_at": "2026-10-24T08:50:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:50:49Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 45,
          "started_at": "2026-10-24T08:50:49Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:51:08Z",
      "conclusion": "failure",
      "created_at": "2026-10-24T08:51:02Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120830302851",
      "id": 120830302851,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "ci",
      "runner_name": "GitHub Actions 1000007990",
      "started_at": "2026-10-24T08:51:05Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-24T08:51:06Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-24T08:51:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:51:06Z",
          "conclusion": "failure",
          "name": "Report the verdict of every job",
          "number": 2,
          "started_at": "2026-10-24T08:51:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-24T08:51:06Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 3,
          "started_at": "2026-10-24T08:51:06Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-24T08:51:02Z",
      "conclusion": "skipped",
      "created_at": "2026-10-24T08:51:03Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/40079379081/job/120830304088",
      "id": 120830304088,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "verdict",
      "runner_name": null,
      "started_at": "2026-10-24T08:51:03Z",
      "status": "completed",
      "steps": []
    }
  ]
};

/** The last CI run on PR 419: green, with three visual shards gating the verdict. */
export const observabilityRun: { run: GitHubActionsRun; jobs: GitHubActionsJob[] } = {
  "run": {
    "conclusion": "success",
    "created_at": "2026-10-23T07:41:23Z",
    "display_title": "feat(observability): traces, metrics and logs on one time axis, a chart lab, and a sample console",
    "event": "pull_request",
    "head_branch": "ccr-f50a5bc0-x2enoh",
    "head_sha": "40dabc775c03155d61e64ab89f90bfe67356c336",
    "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037",
    "id": 39919448037,
    "name": "CI & Visual Regression Checks",
    "run_attempt": 1,
    "run_started_at": "2026-10-23T07:41:23Z",
    "status": "completed",
    "updated_at": "2026-10-23T07:44:56Z"
  },
  "jobs": [
    {
      "completed_at": "2026-10-23T07:42:24Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864423",
      "id": 120300864423,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "build",
      "runner_name": "GitHub Actions 1000007550",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:27Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:29Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:40Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 3,
          "started_at": "2026-10-23T07:41:29Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:52Z",
          "conclusion": "success",
          "name": "Build Package",
          "number": 4,
          "started_at": "2026-10-23T07:41:40Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:22Z",
          "conclusion": "success",
          "name": "Applied Site",
          "number": 5,
          "started_at": "2026-10-23T07:41:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:22Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 9,
          "started_at": "2026-10-23T07:42:22Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:22Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 10,
          "started_at": "2026-10-23T07:42:22Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:22Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 11,
          "started_at": "2026-10-23T07:42:22Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:42:11Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864532",
      "id": 120300864532,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "lint",
      "runner_name": "GitHub Actions 1000007548",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:28Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:29Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-23T07:41:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:30Z",
          "conclusion": "success",
          "name": "Conventional PR Title",
          "number": 3,
          "started_at": "2026-10-23T07:41:29Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:41Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 4,
          "started_at": "2026-10-23T07:41:30Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:41Z",
          "conclusion": "success",
          "name": "Theme Token Drift",
          "number": 5,
          "started_at": "2026-10-23T07:41:41Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:42Z",
          "conclusion": "success",
          "name": "Design Token Drift",
          "number": 6,
          "started_at": "2026-10-23T07:41:41Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:42Z",
          "conclusion": "success",
          "name": "Contrast Gate",
          "number": 7,
          "started_at": "2026-10-23T07:41:42Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:43Z",
          "conclusion": "success",
          "name": "Documented figures",
          "number": 8,
          "started_at": "2026-10-23T07:41:42Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:45Z",
          "conclusion": "success",
          "name": "Documented snippets",
          "number": 9,
          "started_at": "2026-10-23T07:41:43Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:46Z",
          "conclusion": "success",
          "name": "Intent skills",
          "number": 10,
          "started_at": "2026-10-23T07:41:45Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:47Z",
          "conclusion": "success",
          "name": "Documented components",
          "number": 11,
          "started_at": "2026-10-23T07:41:46Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:48Z",
          "conclusion": "success",
          "name": "Story Documentation",
          "number": 12,
          "started_at": "2026-10-23T07:41:47Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:49Z",
          "conclusion": "success",
          "name": "Component contract",
          "number": 13,
          "started_at": "2026-10-23T07:41:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:50Z",
          "conclusion": "success",
          "name": "Slot contract",
          "number": 14,
          "started_at": "2026-10-23T07:41:49Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:51Z",
          "conclusion": "success",
          "name": "Shipped licences",
          "number": 15,
          "started_at": "2026-10-23T07:41:50Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:52Z",
          "conclusion": "success",
          "name": "Reference Material",
          "number": 16,
          "started_at": "2026-10-23T07:41:51Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:53Z",
          "conclusion": "success",
          "name": "ESLint Cache",
          "number": 17,
          "started_at": "2026-10-23T07:41:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:02Z",
          "conclusion": "success",
          "name": "Lint",
          "number": 18,
          "started_at": "2026-10-23T07:41:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:02Z",
          "conclusion": "success",
          "name": "CSS Surface",
          "number": 19,
          "started_at": "2026-10-23T07:42:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "success",
          "name": "Hue-named call sites",
          "number": 20,
          "started_at": "2026-10-23T07:42:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:04Z",
          "conclusion": "success",
          "name": "Terminal schemes",
          "number": 21,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:05Z",
          "conclusion": "success",
          "name": "Font Reachability",
          "number": 22,
          "started_at": "2026-10-23T07:42:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:07Z",
          "conclusion": "success",
          "name": "Dependencies",
          "number": 23,
          "started_at": "2026-10-23T07:42:05Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:08Z",
          "conclusion": "success",
          "name": "Governance",
          "number": 24,
          "started_at": "2026-10-23T07:42:07Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:09Z",
          "conclusion": "success",
          "name": "Post ESLint Cache",
          "number": 46,
          "started_at": "2026-10-23T07:42:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:09Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 47,
          "started_at": "2026-10-23T07:42:09Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:09Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 48,
          "started_at": "2026-10-23T07:42:09Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:09Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 49,
          "started_at": "2026-10-23T07:42:09Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:42:20Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864575",
      "id": 120300864575,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "test",
      "runner_name": "GitHub Actions 1000007549",
      "started_at": "2026-10-23T07:41:25Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:27Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:28Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:39Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 3,
          "started_at": "2026-10-23T07:41:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:50Z",
          "conclusion": "success",
          "name": "Type Check",
          "number": 4,
          "started_at": "2026-10-23T07:41:39Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:17Z",
          "conclusion": "success",
          "name": "Unit Tests and Coverage",
          "number": 5,
          "started_at": "2026-10-23T07:41:50Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:17Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 6,
          "started_at": "2026-10-23T07:42:17Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:18Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 7,
          "started_at": "2026-10-23T07:42:17Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:18Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 13,
          "started_at": "2026-10-23T07:42:18Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:18Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 14,
          "started_at": "2026-10-23T07:42:18Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:18Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 15,
          "started_at": "2026-10-23T07:42:18Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:44:36Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864620",
      "id": 120300864620,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "visual (2)",
      "runner_name": "GitHub Actions 1000007551",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:27Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:01Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:02Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-23T07:42:01Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:02Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-23T07:42:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:02Z",
          "conclusion": "success",
          "name": "Rendering Inputs",
          "number": 5,
          "started_at": "2026-10-23T07:42:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "success",
          "name": "Previous Verdict",
          "number": 6,
          "started_at": "2026-10-23T07:42:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "skipped",
          "name": "Verdict Reused",
          "number": 7,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "success",
          "name": "Shard Key",
          "number": 8,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:04Z",
          "conclusion": "success",
          "name": "Upload Shard Key",
          "number": 9,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:16Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 10,
          "started_at": "2026-10-23T07:42:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:17Z",
          "conclusion": "success",
          "name": "Cache Storybook",
          "number": 11,
          "started_at": "2026-10-23T07:42:16Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:33Z",
          "conclusion": "success",
          "name": "Build Storybook",
          "number": 12,
          "started_at": "2026-10-23T07:42:17Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:33Z",
          "conclusion": "skipped",
          "name": "Visual Coverage",
          "number": 13,
          "started_at": "2026-10-23T07:42:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:33Z",
          "conclusion": "skipped",
          "name": "Docgen Props",
          "number": 14,
          "started_at": "2026-10-23T07:42:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:33Z",
          "conclusion": "skipped",
          "name": "Story Conventions",
          "number": 15,
          "started_at": "2026-10-23T07:42:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:43:06Z",
          "conclusion": "success",
          "name": "Run Visual Regression Tests",
          "number": 16,
          "started_at": "2026-10-23T07:42:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:25Z",
          "conclusion": "success",
          "name": "Run Accessibility Tests",
          "number": 17,
          "started_at": "2026-10-23T07:43:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:28Z",
          "conclusion": "success",
          "name": "Story Selection (shadow)",
          "number": 18,
          "started_at": "2026-10-23T07:44:25Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:28Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 19,
          "started_at": "2026-10-23T07:44:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:30Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 20,
          "started_at": "2026-10-23T07:44:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:30Z",
          "conclusion": "skipped",
          "name": "Upload Playwright Report on Failure",
          "number": 21,
          "started_at": "2026-10-23T07:44:30Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:32Z",
          "conclusion": "success",
          "name": "Upload Generated Snapshots Artifact",
          "number": 22,
          "started_at": "2026-10-23T07:44:30Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:33Z",
          "conclusion": "success",
          "name": "Post Cache Storybook",
          "number": 41,
          "started_at": "2026-10-23T07:44:32Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:33Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 42,
          "started_at": "2026-10-23T07:44:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:33Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 43,
          "started_at": "2026-10-23T07:44:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:34Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 44,
          "started_at": "2026-10-23T07:44:33Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:34Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 45,
          "started_at": "2026-10-23T07:44:34Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:44:48Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864681",
      "id": 120300864681,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "visual (3)",
      "runner_name": "GitHub Actions 1000007552",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:28Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:52Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-23T07:41:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:53Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-23T07:41:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:53Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-23T07:41:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:54Z",
          "conclusion": "success",
          "name": "Rendering Inputs",
          "number": 5,
          "started_at": "2026-10-23T07:41:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:54Z",
          "conclusion": "success",
          "name": "Previous Verdict",
          "number": 6,
          "started_at": "2026-10-23T07:41:54Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:54Z",
          "conclusion": "skipped",
          "name": "Verdict Reused",
          "number": 7,
          "started_at": "2026-10-23T07:41:54Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:54Z",
          "conclusion": "success",
          "name": "Shard Key",
          "number": 8,
          "started_at": "2026-10-23T07:41:54Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:55Z",
          "conclusion": "success",
          "name": "Upload Shard Key",
          "number": 9,
          "started_at": "2026-10-23T07:41:54Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:04Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 10,
          "started_at": "2026-10-23T07:41:55Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:06Z",
          "conclusion": "success",
          "name": "Cache Storybook",
          "number": 11,
          "started_at": "2026-10-23T07:42:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:24Z",
          "conclusion": "success",
          "name": "Build Storybook",
          "number": 12,
          "started_at": "2026-10-23T07:42:06Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:24Z",
          "conclusion": "skipped",
          "name": "Visual Coverage",
          "number": 13,
          "started_at": "2026-10-23T07:42:24Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:24Z",
          "conclusion": "skipped",
          "name": "Docgen Props",
          "number": 14,
          "started_at": "2026-10-23T07:42:24Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:24Z",
          "conclusion": "skipped",
          "name": "Story Conventions",
          "number": 15,
          "started_at": "2026-10-23T07:42:24Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:59Z",
          "conclusion": "success",
          "name": "Run Visual Regression Tests",
          "number": 16,
          "started_at": "2026-10-23T07:42:24Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:36Z",
          "conclusion": "success",
          "name": "Run Accessibility Tests",
          "number": 17,
          "started_at": "2026-10-23T07:42:59Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:39Z",
          "conclusion": "success",
          "name": "Story Selection (shadow)",
          "number": 18,
          "started_at": "2026-10-23T07:44:36Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:39Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 19,
          "started_at": "2026-10-23T07:44:39Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:41Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 20,
          "started_at": "2026-10-23T07:44:39Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:41Z",
          "conclusion": "skipped",
          "name": "Upload Playwright Report on Failure",
          "number": 21,
          "started_at": "2026-10-23T07:44:41Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:43Z",
          "conclusion": "success",
          "name": "Upload Generated Snapshots Artifact",
          "number": 22,
          "started_at": "2026-10-23T07:44:41Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:44Z",
          "conclusion": "success",
          "name": "Post Cache Storybook",
          "number": 41,
          "started_at": "2026-10-23T07:44:43Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:45Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 42,
          "started_at": "2026-10-23T07:44:44Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:45Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 43,
          "started_at": "2026-10-23T07:44:45Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:45Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 44,
          "started_at": "2026-10-23T07:44:45Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:45Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 45,
          "started_at": "2026-10-23T07:44:45Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:42:50Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864745",
      "id": 120300864745,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "build",
      "runner_name": "GitHub Actions 1000007553",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:27Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:28Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 2,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:37Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 3,
          "started_at": "2026-10-23T07:41:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:48Z",
          "conclusion": "success",
          "name": "Build Package",
          "number": 4,
          "started_at": "2026-10-23T07:41:37Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:48Z",
          "conclusion": "success",
          "name": "Bundle Size Budget",
          "number": 5,
          "started_at": "2026-10-23T07:41:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:56Z",
          "conclusion": "success",
          "name": "Dependency Cost",
          "number": 6,
          "started_at": "2026-10-23T07:41:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:58Z",
          "conclusion": "success",
          "name": "Import Cost",
          "number": 7,
          "started_at": "2026-10-23T07:41:56Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:59Z",
          "conclusion": "success",
          "name": "Public API Surface",
          "number": 8,
          "started_at": "2026-10-23T07:41:58Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:48Z",
          "conclusion": "success",
          "name": "Report Generator",
          "number": 9,
          "started_at": "2026-10-23T07:41:59Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:49Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 17,
          "started_at": "2026-10-23T07:42:48Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:49Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 18,
          "started_at": "2026-10-23T07:42:49Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:49Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 19,
          "started_at": "2026-10-23T07:42:49Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:44:14Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120300864750",
      "id": 120300864750,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "visual (1)",
      "runner_name": "GitHub Actions 1000007554",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:28Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:26Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:02Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-23T07:41:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-23T07:42:02Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:03Z",
          "conclusion": "success",
          "name": "Rendering Inputs",
          "number": 5,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:04Z",
          "conclusion": "success",
          "name": "Previous Verdict",
          "number": 6,
          "started_at": "2026-10-23T07:42:03Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:04Z",
          "conclusion": "skipped",
          "name": "Verdict Reused",
          "number": 7,
          "started_at": "2026-10-23T07:42:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:04Z",
          "conclusion": "success",
          "name": "Shard Key",
          "number": 8,
          "started_at": "2026-10-23T07:42:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:05Z",
          "conclusion": "success",
          "name": "Upload Shard Key",
          "number": 9,
          "started_at": "2026-10-23T07:42:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:11Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 10,
          "started_at": "2026-10-23T07:42:05Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:13Z",
          "conclusion": "success",
          "name": "Cache Storybook",
          "number": 11,
          "started_at": "2026-10-23T07:42:11Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:27Z",
          "conclusion": "success",
          "name": "Build Storybook",
          "number": 12,
          "started_at": "2026-10-23T07:42:13Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:27Z",
          "conclusion": "success",
          "name": "Visual Coverage",
          "number": 13,
          "started_at": "2026-10-23T07:42:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:28Z",
          "conclusion": "success",
          "name": "Docgen Props",
          "number": 14,
          "started_at": "2026-10-23T07:42:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:28Z",
          "conclusion": "success",
          "name": "Story Conventions",
          "number": 15,
          "started_at": "2026-10-23T07:42:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:54Z",
          "conclusion": "success",
          "name": "Run Visual Regression Tests",
          "number": 16,
          "started_at": "2026-10-23T07:42:28Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:04Z",
          "conclusion": "success",
          "name": "Run Accessibility Tests",
          "number": 17,
          "started_at": "2026-10-23T07:42:54Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:07Z",
          "conclusion": "success",
          "name": "Story Selection (shadow)",
          "number": 18,
          "started_at": "2026-10-23T07:44:04Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:07Z",
          "conclusion": "success",
          "name": "Telemetry",
          "number": 19,
          "started_at": "2026-10-23T07:44:07Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:08Z",
          "conclusion": "success",
          "name": "Upload Telemetry",
          "number": 20,
          "started_at": "2026-10-23T07:44:07Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:08Z",
          "conclusion": "skipped",
          "name": "Upload Playwright Report on Failure",
          "number": 21,
          "started_at": "2026-10-23T07:44:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:10Z",
          "conclusion": "success",
          "name": "Upload Generated Snapshots Artifact",
          "number": 22,
          "started_at": "2026-10-23T07:44:08Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:11Z",
          "conclusion": "success",
          "name": "Post Cache Storybook",
          "number": 41,
          "started_at": "2026-10-23T07:44:10Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:12Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 42,
          "started_at": "2026-10-23T07:44:11Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:12Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 43,
          "started_at": "2026-10-23T07:44:12Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:12Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 44,
          "started_at": "2026-10-23T07:44:12Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:12Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 45,
          "started_at": "2026-10-23T07:44:12Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:44:56Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:44:48Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120302134230",
      "id": 120302134230,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "verdict",
      "runner_name": "GitHub Actions 1000007557",
      "started_at": "2026-10-23T07:44:50Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:44:52Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:44:51Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:53Z",
          "conclusion": "success",
          "name": "Shard Keys",
          "number": 2,
          "started_at": "2026-10-23T07:44:52Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:53Z",
          "conclusion": "success",
          "name": "Agreed Key",
          "number": 3,
          "started_at": "2026-10-23T07:44:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:53Z",
          "conclusion": "success",
          "name": "Record Verdict",
          "number": 4,
          "started_at": "2026-10-23T07:44:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:53Z",
          "conclusion": "success",
          "name": "Save Verdict",
          "number": 5,
          "started_at": "2026-10-23T07:44:53Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:53Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 6,
          "started_at": "2026-10-23T07:44:53Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:44:52Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:44:48Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448037/job/120302134239",
      "id": 120302134239,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "ci",
      "runner_name": "GitHub Actions 1000007558",
      "started_at": "2026-10-23T07:44:50Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:44:51Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:44:50Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:51Z",
          "conclusion": "success",
          "name": "Report the verdict of every job",
          "number": 2,
          "started_at": "2026-10-23T07:44:51Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:44:51Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 3,
          "started_at": "2026-10-23T07:44:51Z",
          "status": "completed"
        }
      ]
    }
  ]
};

/** The Reports workflow on the same commit: two long jobs. */
export const reportsRun: { run: GitHubActionsRun; jobs: GitHubActionsJob[] } = {
  "run": {
    "conclusion": "success",
    "created_at": "2026-10-23T07:41:23Z",
    "display_title": "feat(observability): traces, metrics and logs on one time axis, a chart lab, and a sample console",
    "event": "pull_request",
    "head_branch": "ccr-f50a5bc0-x2enoh",
    "head_sha": "40dabc775c03155d61e64ab89f90bfe67356c336",
    "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448278",
    "id": 39919448278,
    "name": "Reports",
    "run_attempt": 1,
    "run_started_at": "2026-10-23T07:41:23Z",
    "status": "completed",
    "updated_at": "2026-10-23T07:43:01Z"
  },
  "jobs": [
    {
      "completed_at": "2026-10-23T07:43:00Z",
      "conclusion": "success",
      "created_at": "2026-10-23T07:41:24Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448278/job/120300866210",
      "id": 120300866210,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "build",
      "runner_name": "GitHub Actions 1000007556",
      "started_at": "2026-10-23T07:41:26Z",
      "status": "completed",
      "steps": [
        {
          "completed_at": "2026-10-23T07:41:27Z",
          "conclusion": "success",
          "name": "Set up job",
          "number": 1,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:58Z",
          "conclusion": "success",
          "name": "Initialize containers",
          "number": 2,
          "started_at": "2026-10-23T07:41:27Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:59Z",
          "conclusion": "success",
          "name": "Checkout Repository",
          "number": 3,
          "started_at": "2026-10-23T07:41:58Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:41:59Z",
          "conclusion": "success",
          "name": "Trust the Workspace",
          "number": 4,
          "started_at": "2026-10-23T07:41:59Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:07Z",
          "conclusion": "success",
          "name": "Setup",
          "number": 5,
          "started_at": "2026-10-23T07:41:59Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:15Z",
          "conclusion": "success",
          "name": "Build Package",
          "number": 6,
          "started_at": "2026-10-23T07:42:07Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:17Z",
          "conclusion": "success",
          "name": "Render Manifesto",
          "number": 7,
          "started_at": "2026-10-23T07:42:15Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:20Z",
          "conclusion": "success",
          "name": "Render Compendium",
          "number": 8,
          "started_at": "2026-10-23T07:42:17Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:55Z",
          "conclusion": "success",
          "name": "Report Checks",
          "number": 9,
          "started_at": "2026-10-23T07:42:20Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:57Z",
          "conclusion": "success",
          "name": "Upload Reports",
          "number": 10,
          "started_at": "2026-10-23T07:42:55Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:57Z",
          "conclusion": "success",
          "name": "Post Setup",
          "number": 18,
          "started_at": "2026-10-23T07:42:57Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:57Z",
          "conclusion": "success",
          "name": "Post Checkout Repository",
          "number": 19,
          "started_at": "2026-10-23T07:42:57Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:58Z",
          "conclusion": "success",
          "name": "Stop containers",
          "number": 20,
          "started_at": "2026-10-23T07:42:57Z",
          "status": "completed"
        },
        {
          "completed_at": "2026-10-23T07:42:58Z",
          "conclusion": "success",
          "name": "Complete job",
          "number": 21,
          "started_at": "2026-10-23T07:42:58Z",
          "status": "completed"
        }
      ]
    },
    {
      "completed_at": "2026-10-23T07:43:00Z",
      "conclusion": "skipped",
      "created_at": "2026-10-23T07:43:01Z",
      "html_url": "https://github.com/rtkelly-labs/design-system/actions/runs/39919448278/job/120301460032",
      "id": 120301460032,
      "labels": [
        "ubuntu-latest"
      ],
      "name": "publish",
      "runner_name": null,
      "started_at": "2026-10-23T07:43:01Z",
      "status": "completed",
      "steps": []
    }
  ]
};
