import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input, TextArea } from '../components/Input';
import { useModal } from '../components/useModal';
import { ModalProvider, useConfirm } from '../components/ModalProvider';

const meta: Meta<typeof Modal> = {
  title: 'Foundations/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * Basic controlled modal using simple props.
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8 flex flex-col items-start gap-4">
        <Button variant="cyan" bracketed onClick={() => setIsOpen(true)}>
          OPEN MODAL
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="SYSTEM DIAGNOSTICS"
          subtitle="Node cluster status & health check"
        >
          <p className="font-mono text-sm leading-relaxed text-zinc-300">
            Core cluster runtime is operating within normal boundaries. Memory usage is at 34%, CPU
            utilization at 12%. No memory leaks detected.
          </p>
        </Modal>
      </div>
    );
  },
};

/**
 * Compound component modal composition with custom Header, Description, Body, and Footer.
 */
export const CompoundModal: Story = {
  render: () => {
    const modal = useModal();
    const [env, setEnv] = useState('production');

    return (
      <div className="p-8 flex flex-col items-start gap-4">
        <Button variant="pink" bracketed onClick={() => modal.open()}>
          CONFIGURE PIPELINE
        </Button>

        <Modal isOpen={modal.isOpen} onClose={modal.close} size="lg" variant="pink">
          <Modal.Header
            title="PIPELINE CONFIGURATION"
            subtitle="Release target: v2.4.0-edge"
            badge={<Badge accent="pink">PIPELINE ACTIVE</Badge>}
            onClose={modal.close}
          />
          <Modal.Body className="space-y-4">
            <Modal.Description>
              Adjust runtime parameters and environment secrets prior to deploying the container to the
              edge mesh.
            </Modal.Description>

            <div className="space-y-3 pt-2">
              <Input
                label="Mesh Endpoint"
                defaultValue="https://mesh.edge.internal:8443"
                accent="pink"
              />
              <Input
                label="Environment Secret Key"
                type="password"
                defaultValue="************************"
                accent="pink"
              />
              <TextArea
                label="Custom Environment Flags"
                rows={3}
                defaultValue={`FEATURE_FLAG_TURBO=1\nENABLE_TELEMETRY=0`}
              />
            </div>
          </Modal.Body>
          <Modal.Footer align="between">
            <Button variant="white" size="sm" bracketed onClick={modal.close}>
              CANCEL
            </Button>
            <div className="flex gap-2">
              <Button
                variant="pink"
                size="sm"
                bracketed
                onClick={() => {
                  alert('Pipeline deployed!');
                  modal.close();
                }}
              >
                DEPLOY CHANGES
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },
};

/**
 * Confirmation / Destructive Dialog.
 */
export const ConfirmationDialog: Story = {
  render: () => {
    const modal = useModal();
    const [status, setStatus] = useState<string | null>(null);

    return (
      <div className="p-8 flex flex-col items-start gap-4">
        <Button variant="pink" bracketed onClick={() => modal.open()}>
          DELETE REPOSITORY
        </Button>
        {status && <p className="font-mono text-sm text-brutalist-cyan">&gt; {status}</p>}

        <Modal
          isOpen={modal.isOpen}
          onClose={modal.close}
          title="DESTRUCTIVE ACTION"
          subtitle="Permanent repository purge"
          variant="destructive"
          size="sm"
          role="alertdialog"
          footer={
            <div className="flex items-center gap-3 w-full justify-end">
              <Button variant="white" size="sm" bracketed onClick={modal.close}>
                CANCEL
              </Button>
              <Button
                variant="pink"
                size="sm"
                bracketed
                onClick={() => {
                  setStatus('Repository destroyed at ' + new Date().toLocaleTimeString());
                  modal.close();
                }}
              >
                CONFIRM PURGE
              </Button>
            </div>
          }
        >
          <p className="font-mono text-xs leading-relaxed text-zinc-300">
            WARNING: This operation is permanent and cannot be undone. All commits, issues, and git history
            will be erased immediately.
          </p>
        </Modal>
      </div>
    );
  },
};

/**
 * Multi-step wizard inside a modal.
 */
export const MultiStepWizard: Story = {
  render: () => {
    const modal = useModal();
    const [step, setStep] = useState(1);

    const handleOpen = () => {
      setStep(1);
      modal.open();
    };

    return (
      <div className="p-8 flex flex-col items-start gap-4">
        <Button variant="cyan" bracketed onClick={handleOpen}>
          START ONBOARDING WIZARD
        </Button>

        <Modal isOpen={modal.isOpen} onClose={modal.close} size="md" variant="cyan">
          <Modal.Header
            title={`ONBOARDING: STEP 0${step} / 03`}
            subtitle="Configure your developer node"
            badge={<Badge accent="cyan">{step === 3 ? 'FINAL' : 'IN PROGRESS'}</Badge>}
            onClose={modal.close}
          />
          <Modal.Body className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <p className="font-mono text-xs text-zinc-400">
                  Step 1: Assign an identity and callsign for the node instance.
                </p>
                <Input label="Node Callsign" placeholder="e.g. CYBER-PULSE-01" accent="cyan" />
                <Input label="Admin Email" placeholder="ops@mesh.dev" accent="cyan" />
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <p className="font-mono text-xs text-zinc-400">
                  Step 2: Choose your security tier and network topology.
                </p>
                <div className="p-3 border-2 border-zinc-700 bg-zinc-900 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white text-sm">ENCLAVE ISOLATION</div>
                    <div className="text-xs text-zinc-400">Hardware-level memory encryption</div>
                  </div>
                  <Badge accent="cyan">ENABLED</Badge>
                </div>
                <div className="p-3 border-2 border-zinc-700 bg-zinc-900 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white text-sm">PEER DISCOVERY</div>
                    <div className="text-xs text-zinc-400">Gossip protocol multicast</div>
                  </div>
                  <Badge accent="green">DISABLED</Badge>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <p className="font-mono text-xs text-zinc-400">
                  Step 3: Review and confirm activation.
                </p>
                <div className="p-4 bg-black border-2 border-brutalist-cyan font-mono text-xs space-y-1 text-zinc-300">
                  <div>&gt; INITIALIZING CORE ENGINE... OK</div>
                  <div>&gt; ALLOCATING MEMORY ENCLAVE... OK</div>
                  <div>&gt; READY TO LAUNCH ON MESH NETWORK.</div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer align="between">
            {step > 1 ? (
              <Button variant="white" size="sm" bracketed onClick={() => setStep(step - 1)}>
                BACK
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button variant="white" size="sm" bracketed onClick={modal.close}>
                CANCEL
              </Button>
              {step < 3 ? (
                <Button variant="cyan" size="sm" bracketed onClick={() => setStep(step + 1)}>
                  NEXT STEP
                </Button>
              ) : (
                <Button
                  variant="cyan"
                  size="sm"
                  bracketed
                  onClick={() => {
                    alert('Node activated successfully!');
                    modal.close();
                  }}
                >
                  FINISH &amp; LAUNCH
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },
};

/**
 * Size variants demonstration.
 */
export const SizeVariants: Story = {
  render: () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full' | null>(null);

    return (
      <div className="p-8 flex flex-col gap-4">
        <h4 className="font-display text-lg text-white">[ SELECT MODAL SIZE ]</h4>
        <div className="flex flex-wrap gap-3">
          {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((s) => (
            <Button key={s} variant="cyan" bracketed onClick={() => setSize(s)}>
              {s.toUpperCase()} SIZE
            </Button>
          ))}
        </div>

        {size && (
          <Modal
            isOpen={true}
            onClose={() => setSize(null)}
            title={`SIZE VARIANT: ${size.toUpperCase()}`}
            subtitle={`Rendering dialog with max-width variant "${size}"`}
            size={size}
          >
            <div className="space-y-3 font-mono text-xs text-zinc-300">
              <p>
                This modal is displayed using the <code className="text-brutalist-cyan">size="{size}"</code> property.
              </p>
              <p>
                All brutalist layout bounds, borders, and responsive behaviors automatically adjust across
                mobile and desktop viewports.
              </p>
            </div>
          </Modal>
        )}
      </div>
    );
  },
};

/**
 * Theme & Color Variants demonstration (default/cyan, pink, yellow, destructive, terminal).
 */
export const VariantAccents: Story = {
  render: () => {
    const [variant, setVariant] = useState<
      'cyan' | 'pink' | 'yellow' | 'destructive' | 'terminal' | null
    >(null);

    return (
      <div className="p-8 flex flex-col gap-4">
        <h4 className="font-display text-lg text-white">[ SELECT COLOR VARIANT ]</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="cyan" bracketed onClick={() => setVariant('cyan')}>
            CYAN THEME
          </Button>
          <Button variant="pink" bracketed onClick={() => setVariant('pink')}>
            PINK THEME
          </Button>
          <Button variant="yellow" bracketed onClick={() => setVariant('yellow')}>
            YELLOW THEME
          </Button>
          <Button variant="pink" bracketed onClick={() => setVariant('destructive')}>
            DESTRUCTIVE
          </Button>
          <Button variant="cyan" bracketed onClick={() => setVariant('terminal')}>
            TERMINAL
          </Button>
        </div>

        {variant && (
          <Modal
            isOpen={true}
            onClose={() => setVariant(null)}
            title={`${variant.toUpperCase()} THEME`}
            subtitle={`Dual-mode brutalist token variant "${variant}"`}
            variant={variant}
          >
            <p className="font-mono text-xs text-zinc-300">
              Accents, shadows, border glows, and typography dynamically adapt to the active modal variant.
            </p>
          </Modal>
        )}
      </div>
    );
  },
};

/**
 * Imperative modal invocation via ModalProvider and useConfirm() hook.
 */
function ImperativeDemoComponent() {
  const { confirm, alert } = useConfirm();
  const [result, setResult] = useState<string | null>(null);

  const handleConfirm = async () => {
    const confirmed = await confirm({
      title: 'CONFIRM DEPLOYMENT',
      subtitle: 'Cluster: production-us-east',
      message: 'Are you sure you want to promote build #8942 to all live edge nodes?',
      confirmText: 'PROCEED WITH ROLLOUT',
      cancelText: 'ABORT',
      variant: 'cyan',
    });
    setResult(confirmed ? 'User approved rollout' : 'User aborted rollout');
  };

  const handleAlert = async () => {
    await alert('Cluster maintenance completed successfully.', 'STATUS UPDATE', {
      variant: 'yellow',
    });
    setResult('User acknowledged maintenance alert');
  };

  return (
    <div className="p-8 flex flex-col items-start gap-4">
      <h4 className="font-display text-lg text-white">[ IMPERATIVE MODAL SYSTEM ]</h4>
      <div className="flex gap-3">
        <Button variant="cyan" bracketed onClick={handleConfirm}>
          TRIGGER CONFIRM PROMISE
        </Button>
        <Button variant="yellow" bracketed onClick={handleAlert}>
          TRIGGER ALERT PROMISE
        </Button>
      </div>
      {result && <p className="font-mono text-sm text-brutalist-pink">&gt; Result: {result}</p>}
    </div>
  );
}

export const ImperativeWithProvider: Story = {
  render: () => (
    <ModalProvider>
      <ImperativeDemoComponent />
    </ModalProvider>
  ),
};
