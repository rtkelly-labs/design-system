#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import process from 'node:process';

function run(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const branchArg = args.find((a) => a.startsWith('--target='));
const targetBranch = branchArg ? branchArg.split('=')[1] : 'production';
const sourceBranch = 'main';

// 1. Detect repository (owner/repo)
let repo = process.env.GITHUB_REPOSITORY;
if (!repo) {
  const remoteUrl = run('git config --get remote.origin.url');
  if (remoteUrl) {
    const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/.]+)/);
    if (match) repo = match[1].replace(/\.git$/, '');
  }
}

if (!repo) {
  console.error('❌ Could not determine GitHub repository.');
  process.exit(1);
}

// 2. Determine current commit of source branch (main)
const sourceSha = run(
  `git rev-parse origin/${sourceBranch} 2>/dev/null || git rev-parse HEAD`,
);
if (!sourceSha) {
  console.error(`❌ Could not determine HEAD of ${sourceBranch}.`);
  process.exit(1);
}

// 3. Determine current pointer of target branch (production)
const targetRefLine = run(`git ls-remote origin refs/heads/${targetBranch}`);
let targetSha = null;
if (targetRefLine) {
  targetSha = targetRefLine.split(/\s+/)[0];
}

// 4. Query GitHub Deployments API for latest Production deployments
let prodDeployments = [];
try {
  const deploymentsJson = run(`gh api "repos/${repo}/deployments?per_page=15"`);
  if (deploymentsJson) {
    const allDeployments = JSON.parse(deploymentsJson);
    // Find deployments belonging to production environments
    const matched = allDeployments.filter((d) => {
      const env = (d.environment || d.original_environment || '').toLowerCase();
      return env.includes('production') || env === 'prod';
    });

    // Group by environment name so we have the latest deployment for each project surface
    const latestByEnv = new Map();
    for (const d of matched) {
      const envKey = d.environment || d.original_environment;
      if (!latestByEnv.has(envKey)) {
        latestByEnv.set(envKey, d);
      }
    }

    prodDeployments = Array.from(latestByEnv.values());

    // Fetch status for each deployment
    for (const deploy of prodDeployments) {
      const statusesJson = run(
        `gh api "repos/${repo}/deployments/${deploy.id}/statuses?per_page=1"`,
      );
      if (statusesJson) {
        const statuses = JSON.parse(statusesJson);
        deploy.latestStatus = statuses[0] || null;
      }
    }
  }
} catch (e) {
  console.warn(`⚠️ Warning: Could not fetch deployments: ${e.message}`);
}

// 5. Check CI check-runs for sourceSha
let ciPending = false;
let ciFailed = false;
let ciSummary = 'unknown';

try {
  const checkRunsJson = run(
    `gh api "repos/${repo}/commits/${sourceSha}/check-runs?per_page=50"`,
  );
  if (checkRunsJson) {
    const data = JSON.parse(checkRunsJson);
    const checkRuns = data.check_runs || [];

    // Filter out release-train runs and background backup tasks
    const relevantChecks = checkRuns.filter(
      (c) =>
        !c.name.toLowerCase().includes('release-train') &&
        !c.name.toLowerCase().includes('release train') &&
        !c.name.toLowerCase().includes('backup-main'),
    );

    if (relevantChecks.length > 0) {
      const inProgress = relevantChecks.filter(
        (c) => c.status === 'in_progress' || c.status === 'queued',
      );
      const failed = relevantChecks.filter(
        (c) =>
          c.status === 'completed' &&
          ['failure', 'timed_out', 'cancelled'].includes(c.conclusion),
      );
      const successful = relevantChecks.filter(
        (c) => c.status === 'completed' && c.conclusion === 'success',
      );

      if (failed.length > 0) {
        ciFailed = true;
        ciSummary = `failed (${failed.map((c) => c.name).join(', ')})`;
      } else if (inProgress.length > 0) {
        ciPending = true;
        ciSummary = `in progress (${inProgress.map((c) => c.name).join(', ')})`;
      } else if (successful.length > 0) {
        ciSummary = `passed (${successful.length} checks)`;
      }
    } else {
      ciSummary = 'no blocking checks';
    }
  }
} catch (e) {
  console.warn(`⚠️ Warning: Could not fetch check-runs: ${e.message}`);
}

// 6. Assess deployment requirement
const isTargetDrift = !targetSha || targetSha !== sourceSha;

let anyDeployFailed = false;
let anyDeployPending = false;
let anyDeployOutdated = false;
const deployDetails = [];

if (prodDeployments.length > 0) {
  for (const dep of prodDeployments) {
    const state = dep.latestStatus?.state || 'unknown';
    const sha = dep.sha || 'unknown';
    const env = dep.environment || 'production';
    deployDetails.push(`${env}: [${sha.slice(0, 7)}] ${state}`);

    if (['failure', 'error'].includes(state)) {
      anyDeployFailed = true;
    }
    if (['pending', 'in_progress', 'queued'].includes(state)) {
      anyDeployPending = true;
    }
    if (sha !== sourceSha) {
      anyDeployOutdated = true;
    }
  }
} else {
  // No previous deployments found
  anyDeployOutdated = true;
}

let shouldDeploy = false;
let actionReason = '';

if (anyDeployPending && !force) {
  shouldDeploy = false;
  actionReason = `A deployment is currently in progress (${deployDetails.join('; ')}). Holding release train.`;
} else if (ciFailed && !force) {
  shouldDeploy = false;
  actionReason = `CI checks failed for ${sourceSha.slice(0, 7)}: ${ciSummary}. Release blocked.`;
} else if (ciPending && !force) {
  shouldDeploy = false;
  actionReason = `CI checks still running for ${sourceSha.slice(0, 7)}: ${ciSummary}. Holding release train.`;
} else if (force) {
  shouldDeploy = true;
  actionReason = `Forced deployment requested for ${sourceSha.slice(0, 7)}.`;
} else if (anyDeployFailed) {
  shouldDeploy = true;
  actionReason = `Previous deployment had failures (${deployDetails.join('; ')}). Redeploying.`;
} else if (isTargetDrift || anyDeployOutdated) {
  shouldDeploy = true;
  if (isTargetDrift && targetSha) {
    actionReason = `Pointer ${targetBranch} (${targetSha.slice(0, 7)}) is behind ${sourceBranch} (${sourceSha.slice(0, 7)}).`;
  } else if (!targetSha) {
    actionReason = `Initial release: initializing ${targetBranch} pointer to ${sourceSha.slice(0, 7)}.`;
  } else {
    actionReason = `Deployed code is behind ${sourceBranch} (${sourceSha.slice(0, 7)}).`;
  }
} else {
  shouldDeploy = false;
  actionReason = `Production is already up to date with ${sourceSha.slice(0, 7)} and healthy.`;
}

console.log('--- Release Train Assessment ---');
console.log(`Repository:                  ${repo}`);
console.log(`Source Commit (${sourceBranch}):        ${sourceSha.slice(0, 7)}`);
console.log(
  `Target Pointer (${targetBranch}):   ${targetSha ? targetSha.slice(0, 7) : '(none)'}`,
);
console.log(
  `Deployments:                 ${deployDetails.length > 0 ? deployDetails.join(', ') : '(none found)'}`,
);
console.log(`CI Status:                   ${ciSummary}`);
console.log(
  `Decision:                    ${shouldDeploy ? '🚀 DEPLOY' : '⏸️ SKIP'}`,
);
console.log(`Reason:                      ${actionReason}\n`);

// Write GitHub Action outputs if in runner
const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  appendFileSync(outputFile, `should_deploy=${shouldDeploy}\n`);
  appendFileSync(outputFile, `source_sha=${sourceSha}\n`);
  appendFileSync(outputFile, `target_sha=${targetSha || ''}\n`);
  appendFileSync(outputFile, `reason=${actionReason.replace(/\n/g, ' ')}\n`);
}

// Write GitHub Action Step Summary
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  const statusEmoji = shouldDeploy ? '🚀' : ciFailed ? '🛑' : '✅';
  const markdown = `
### ${statusEmoji} Release Train Assessment

| Metric | Value |
| :--- | :--- |
| **Repository** | \`${repo}\` |
| **Source Commit (\`${sourceBranch}\`)** | \`${sourceSha.slice(0, 7)}\` |
| **Pointer Commit (\`${targetBranch}\`)** | \`${targetSha ? targetSha.slice(0, 7) : 'None'}\` |
| **Deployments** | ${deployDetails.length > 0 ? deployDetails.map((d) => `\`${d}\``).join('<br/>') : 'None'} |
| **CI Status** | \`${ciSummary}\` |
| **Action** | **${shouldDeploy ? (dryRun ? 'WOULD DEPLOY (DRY RUN)' : 'DEPLOYED') : 'SKIPPED'}** |
| **Reason** | ${actionReason} |
`;
  appendFileSync(summaryFile, markdown);
}

// Execute deployment if required
if (shouldDeploy) {
  if (dryRun) {
    console.log(
      `[DRY RUN] Would advance ${targetBranch} pointer to ${sourceSha.slice(0, 7)}.`,
    );
  } else {
    console.log(
      `Advancing ${targetBranch} pointer to ${sourceSha.slice(0, 7)}...`,
    );
    if (targetSha === sourceSha) {
      console.log(
        'Target pointer already equals source SHA. Toggling pointer briefly to emit push event...',
      );
      run(`git push origin ${sourceSha}~1:refs/heads/${targetBranch} --force`);
    }
    const pushRes = run(
      `git push origin ${sourceSha}:refs/heads/${targetBranch} --force`,
    );
    if (pushRes === null) {
      console.error(`❌ Failed to push ${targetBranch} pointer to remote.`);
      process.exit(1);
    }
    console.log(
      `✅ Production pointer advanced to ${sourceSha.slice(0, 7)}. Vercel deployment queued.`,
    );
  }
} else {
  console.log('No pointer update required.');
}

if (ciFailed && !force) {
  process.exit(1);
}
