import fc from 'fast-check';

/**
 * One fast-check seed for every property under Stryker.
 *
 * The unit suite draws a fresh seed each run so the models keep exploring.
 * Under Stryker that same freedom is noise. The coverage dry run and every
 * mutant run would generate different sequences, so a model could cover a
 * mutant in one run and miss it in the next. Two mutation runs of one commit
 * then disagree by a point or two (#445). A fixed seed makes the model kill
 * the same mutants every time, so a change in score comes from a change in
 * the tests.
 *
 * `FC_SEED` overrides the seed, to check that a result does not hinge on one
 * lucky sequence.
 */
fc.configureGlobal({ seed: Number(process.env.FC_SEED ?? 445) });
