import type { QuotationStatus } from '../types';

/**
 * WorkflowTracker - Displays the 4-step automation workflow progress.
 * Extracted from QuotationDetailPage to eliminate inline styles and improve reusability.
 */

interface WorkflowStep {
  label: string;
  description: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { label: '1. Tiếp nhận yêu cầu', description: 'Kiểm tra tính hợp lệ & Idempotency key' },
  { label: '2. Chuyển sang Mac mini', description: 'Codex CLI phân tích an toàn & tạo thư ngỏ' },
  { label: '3. Nhân bản từ File mẫu', description: 'Điền bảng giá & điều khoản vào template' },
  { label: '4. File báo giá hoàn chỉnh', description: 'Sẵn sàng tải về dạng .xlsx' },
];

function getActiveStepIndex(status: QuotationStatus): number {
  switch (status) {
    case 'PENDING': return 1;
    case 'PROCESSING': return 2;
    case 'COMPLETED': return 4;
    case 'FAILED': return 0;
    default: return 0;
  }
}

interface WorkflowTrackerProps {
  status: QuotationStatus;
}

export default function WorkflowTracker({ status }: WorkflowTrackerProps) {
  const activeStep = getActiveStepIndex(status);

  return (
    <div className="card mb-6">
      <div className="card-header workflow-tracker-header">
        <h3>Tiến trình tự động hóa (Workflow Mac mini & Codex CLI)</h3>
      </div>
      <div className="card-body">
        <div className="workflow-steps">
          {WORKFLOW_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = activeStep >= stepNumber;
            const isCompleted = stepNumber === 4 && status === 'COMPLETED';

            const className = [
              'workflow-step',
              isActive ? 'workflow-step--active' : '',
              isCompleted ? 'workflow-step--completed' : '',
            ].filter(Boolean).join(' ');

            return (
              <div key={stepNumber} className={className}>
                <div className="workflow-step-label">{step.label}</div>
                <div className="workflow-step-desc">{step.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
